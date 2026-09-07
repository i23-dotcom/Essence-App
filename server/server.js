require("dotenv").config();
const express=require("express"), cors=require("cors"), rateLimit=require("express-rate-limit"), bcrypt=require("bcryptjs"), jwt=require("jsonwebtoken"), {Pool}=require("pg");
const app=express();
const PORT=process.env.PORT||8080;
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==="true"?{rejectUnauthorized:false}:false});
app.use(cors({origin:(process.env.CORS_ORIGIN||"http://localhost:8080").split(",").map(x=>x.trim())}));
app.use(express.json({limit:"2mb"}));
app.use(rateLimit({windowMs:15*60*1000,max:300}));
const JWT_SECRET=process.env.JWT_SECRET||"CHANGE_ME";

function auth(req,res,next){const h=req.headers.authorization||"";if(!h.startsWith("Bearer "))return res.status(401).json({error:"Authentication required"});try{req.user=jwt.verify(h.slice(7),JWT_SECRET);next()}catch(e){return res.status(401).json({error:"Invalid token"})}}
function roles(...allowed){return (req,res,next)=>allowed.includes(req.user?.role)?next():res.status(403).json({error:"Insufficient permission"})}
async function audit(req,action,area,detail=""){try{await pool.query("INSERT INTO audit_log(user_id,user_email,action,area,detail) VALUES($1,$2,$3,$4,$5)",[req.user?.id||null,req.user?.email||"system",action,area,detail])}catch{}}

app.get("/api/health",async(req,res)=>{try{await pool.query("SELECT 1");res.json({status:"ok",database:"ok",time:new Date().toISOString()})}catch(e){res.status(503).json({status:"degraded",database:"error"})}});
app.post("/api/auth/login",async(req,res)=>{const {email,password}=req.body;const r=await pool.query("SELECT id,email,password_hash,role,active FROM users WHERE lower(email)=lower($1)",[email||""]);const u=r.rows[0];if(!u||!u.active||!(await bcrypt.compare(password||"",u.password_hash)))return res.status(401).json({error:"Invalid credentials"});const token=jwt.sign({id:u.id,email:u.email,role:u.role},JWT_SECRET,{expiresIn:"8h"});res.json({token,user:{id:u.id,email:u.email,role:u.role}})});
app.get("/api/me",auth,(req,res)=>res.json(req.user));

app.get("/api/articles",auth,async(req,res)=>{const r=await pool.query("SELECT * FROM articles ORDER BY updated_at DESC");res.json(r.rows)});
app.post("/api/articles",auth,roles("admin","editor","journalist"),async(req,res)=>{const {title,category,status,body}=req.body;if(!title)return res.status(400).json({error:"title required"});const r=await pool.query("INSERT INTO articles(title,category,status,body,author_id) VALUES($1,$2,$3,$4,$5) RETURNING *",[title,category||"General",status||"draft",body||"",req.user.id]);await audit(req,"create_article","editorial",title);res.status(201).json(r.rows[0])});
app.patch("/api/articles/:id",auth,roles("admin","editor","journalist"),async(req,res)=>{const {title,category,status,body}=req.body;const r=await pool.query("UPDATE articles SET title=COALESCE($1,title),category=COALESCE($2,category),status=COALESCE($3,status),body=COALESCE($4,body),updated_at=now() WHERE id=$5 RETURNING *",[title,category,status,body,req.params.id]);if(!r.rows[0])return res.status(404).json({error:"Not found"});await audit(req,"update_article","editorial",req.params.id);res.json(r.rows[0])});

app.get("/api/programmes",auth,async(req,res)=>res.json((await pool.query("SELECT * FROM programmes ORDER BY title")).rows));
app.post("/api/programmes",auth,roles("admin","editor","producer"),async(req,res)=>{const {title,genre,duration_minutes,description}=req.body;if(!title)return res.status(400).json({error:"title required"});const r=await pool.query("INSERT INTO programmes(title,genre,duration_minutes,description) VALUES($1,$2,$3,$4) RETURNING *",[title,genre||"General",duration_minutes||60,description||""]);await audit(req,"create_programme","production",title);res.status(201).json(r.rows[0])});

app.get("/api/schedule",auth,async(req,res)=>res.json((await pool.query("SELECT s.*,p.title AS programme_title FROM schedule s LEFT JOIN programmes p ON p.id=s.programme_id ORDER BY start_time")).rows));
app.post("/api/schedule",auth,roles("admin","editor","producer"),async(req,res)=>{const {programme_id,programme_title,start_time,duration_minutes}=req.body;let pid=programme_id;if(!pid&&programme_title){const q=await pool.query("SELECT id FROM programmes WHERE lower(title)=lower($1) LIMIT 1",[programme_title]);pid=q.rows[0]?.id||null}const r=await pool.query("INSERT INTO schedule(programme_id,start_time,duration_minutes) VALUES($1,$2,$3) RETURNING *",[pid,start_time,duration_minutes||60]);await audit(req,"create_schedule","epg",String(start_time));res.status(201).json(r.rows[0])});

app.get("/api/live",auth,async(req,res)=>{const r=await pool.query("SELECT * FROM live_config WHERE channel='essence' LIMIT 1");res.json(r.rows[0]||{channel:"essence",state:"on_air",programme:"",message:""})});
app.put("/api/live",auth,roles("admin","producer","editor"),async(req,res)=>{const {state,programme,message,primary_stream,backup_stream}=req.body;const r=await pool.query(`INSERT INTO live_config(channel,state,programme,message,primary_stream,backup_stream,updated_by) VALUES('essence',$1,$2,$3,$4,$5,$6)
ON CONFLICT(channel) DO UPDATE SET state=EXCLUDED.state,programme=EXCLUDED.programme,message=EXCLUDED.message,primary_stream=EXCLUDED.primary_stream,backup_stream=EXCLUDED.backup_stream,updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`,[state||"on_air",programme||"",message||"",primary_stream||"",backup_stream||"",req.user.id]);await audit(req,"update_live","broadcast",state||"on_air");res.json(r.rows[0])});

app.get("/api/media",auth,async(req,res)=>res.json((await pool.query("SELECT * FROM media_assets ORDER BY created_at DESC")).rows));
app.post("/api/media",auth,roles("admin","producer","editor"),async(req,res)=>{const {name,type,storage_url,status}=req.body;if(!name)return res.status(400).json({error:"name required"});const r=await pool.query("INSERT INTO media_assets(name,type,storage_url,status,created_by) VALUES($1,$2,$3,$4,$5) RETURNING *",[name,type||"video",storage_url||"",status||"READY",req.user.id]);await audit(req,"register_media","media",name);res.status(201).json(r.rows[0])});
app.get("/api/audit",auth,roles("admin","editor"),async(req,res)=>res.json((await pool.query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200")).rows));


// Stream routing control. This selects the source for a downstream broadcast router.
app.get("/api/stream-router",auth,async(req,res)=>{
  const r=await pool.query("SELECT * FROM live_config WHERE channel='essence' LIMIT 1");
  const x=r.rows[0]||{};
  res.json({channel:"essence",route:x.route||"primary",state:x.state||"on_air",
    primary_stream:x.primary_stream||"",backup_stream:x.backup_stream||"",
    emergency_stream:x.emergency_stream||"",no_signal_stream:x.no_signal_stream||"",
    updated_at:x.updated_at||null});
});
app.put("/api/stream-router",auth,roles("admin","producer"),async(req,res)=>{
  const allowed=["primary","backup","emergency","no_signal"], route=req.body.route;
  if(!allowed.includes(route)) return res.status(400).json({error:"Invalid route"});
  const state={primary:"on_air",backup:"on_air",emergency:"emergency",no_signal:"no_signal"}[route];
  const r=await pool.query(`INSERT INTO live_config(channel,state,route,updated_by)
    VALUES('essence',$1,$2,$3)
    ON CONFLICT(channel) DO UPDATE SET state=EXCLUDED.state,route=EXCLUDED.route,
    updated_by=EXCLUDED.updated_by,updated_at=now() RETURNING *`,
    [state,route,req.user.id]);
  await audit(req,"route_stream","broadcast",route);
  res.json(r.rows[0]);
});

app.listen(PORT,()=>console.log(`Essence Master Control API listening on ${PORT}`));
