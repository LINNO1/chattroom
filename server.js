const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const mime = require('mime'); // 第三方模块
var cache = {};

const chatServer = require('./lib/chat_server');

const server = http.createServer((req,res)=>{
	let pathname = url.parse(req.url,true).pathname;
	if(pathname=='/'){
		pathname+='index.html';
	}
    const staticPath = __dirname + '/static';
    filePath = path.join(staticPath,pathname);
 
    serverStatic(res,cache,filePath);
})
server.listen(3000,()=>{
	console.log('localhost:8080');
})
// 提供已经定义好的http服务器
chatServer.listen(server);

const staticRoute = (req,res)=>{
	const pathname = url.parse(res.url,true).pathname;
	console.log(filePath);
}


const send404 = (res)=>{	
	res.setHeader('Content-Type','text/plain');
	res.writeHead(404,"not find");
	res.end('Error 404: not find');
}
const sendFile =(res,filePath,fileContent)=>{  
	res.setHeader('Content-Type',mime.getType(path.basename(filePath)));
	res.writeHead(200,"ok");
    res.end(fileContent);
}

// 读取文件，并实现缓存功能
const serverStatic = (res,cache,absPath)=>{
	console.log(absPath);
	if(cache[absPath]){
		sendFile(res,absPath,cache[absPath]);
	}else{
		fs.exists(absPath,(exists)=>{
			if(exists){
				fs.readFile(absPath,(err,data)=>{
					if(err){
						console.log('read err');
						send404(res);
					}else{
						cache[absPath]=data;
						sendFile(res,absPath,data);
					}
				})
			}else{
				send404(res);
			}
		})
	}
}