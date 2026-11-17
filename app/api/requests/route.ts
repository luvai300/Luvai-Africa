import { getDb } from '../../../db';
import { enquiries } from '../../../db/schema';
export async function POST(request:Request) {
 try { const b=await request.json() as Record<string, any>;
 if(!['enquiry','journey','seller','newsletter'].includes(b.kind)||typeof b.name!=='string'||b.name.trim().length<2||typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email)||typeof b.details!=='string'||b.details.length>6000) return Response.json({error:'Please enter a valid name, email and message.'},{status:400});
 await getDb().insert(enquiries).values({kind:b.kind,name:b.name.trim().slice(0,120),email:b.email.slice(0,254),details:b.details});
 return Response.json({ok:true,reference:crypto.randomUUID().slice(0,8).toUpperCase()});
 }catch{return Response.json({error:'Your request could not be saved. Please try again.'},{status:500});}
}
