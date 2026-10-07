import {NextResponse} from 'next/server';
import {requireUser} from '@/lib/access';
import {prisma} from '@/lib/prisma';
import {WorkflowError} from '@/lib/validation';
export async function GET(){try{
    const user=await requireUser(['ADMIN','RESPONDER']);
    const memberships=user.role==='ADMIN'?[]:await prisma.miSaludMembership.findMany({where:{userId:user.id,role:'TEAM_LEADER',status:'APPROVED'},select:{teamId:true}});
    const count=await prisma.miSaludRequest.count({where:{status:'PENDING',...(user.role==='ADMIN'?{reviewLevel:'ADMIN'}:{reviewLevel:'TEAM_LEADER',teamId:{in:memberships.map(m=>m.teamId)}})}});
    return NextResponse.json({count});
}catch(e){return NextResponse.json({error:'Access denied'},{status:e instanceof WorkflowError?e.status:500});}}
