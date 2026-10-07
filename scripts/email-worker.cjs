require('@next/env').loadEnvConfig(process.cwd());
const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
const originalLoad=Module._load;Module._load=function(name,parent,isMain){if(name.startsWith('@/'))name=path.join(process.cwd(),'src',name.slice(2));return originalLoad.call(this,name,parent,isMain);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
const {retryPendingEmails}=require('../src/lib/mail/outbox.ts');let running=false;
async function run(){if(running)return;running=true;try{require('@next/env').loadEnvConfig(process.cwd(),true,{info(){},error(){}},true);const result=await retryPendingEmails();if(result.attempted)console.log(JSON.stringify(result));}catch{console.error('Email retry failed. Check database and SMTP configuration.');}finally{running=false;}}
console.log('Email retry worker running.');run();setInterval(run,60000);
