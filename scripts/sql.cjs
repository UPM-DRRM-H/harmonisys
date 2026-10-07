const fs=require('fs');
// Split SQL while retaining quoted strings, comments and dollar-quoted DO bodies.
function splitSql(sql){const out=[];let start=0,quote=null,dollar=null,line=false,block=false;
for(let i=0;i<sql.length;i++){const c=sql[i],n=sql[i+1];if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(dollar){if(sql.startsWith(dollar,i)){i+=dollar.length-1;dollar=null;}continue;}if(quote){if(c===quote){if(n===quote)i++;else quote=null;}continue;}if(c==='-'&&n==='-'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='$'){const match=sql.slice(i).match(/^\$[a-zA-Z_0-9]*\$/);if(match){dollar=match[0];i+=dollar.length-1;continue;}}if(c===';'){const value=sql.slice(start,i).trim();if(value)out.push(value);start=i+1;}}
const tail=sql.slice(start).trim();if(tail)out.push(tail);return out;}
async function executeSql(tx,sql){for(const statement of splitSql(sql))await tx.$executeRawUnsafe(statement);}
module.exports={splitSql,executeSql};
