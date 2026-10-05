const path=require('path'),fs=require('fs');
const APP=process.env.APP||path.resolve(__dirname,'../www/index.html');
const OUT=process.env.OUT||'/tmp/t';
fs.mkdirSync(OUT,{recursive:true});
module.exports={APP,OUT};
