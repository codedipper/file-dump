import { createServer } from 'node:http';
import { readdirSync, mkdirSync, readFileSync, existsSync, renameSync } from 'node:fs';
import formidable from 'formidable';
import mime from 'mime-db';
import cfg from './config.mjs';

var types = {};
Object.keys(mime).forEach((type) => {
	if (!mime[type].extensions) return;

	for (let i = 0; i < mime[type].extensions.length; i++){
		types[mime[type].extensions[i]] = type;
	}
});

if (!existsSync('files/')) mkdirSync('files/');

const server = createServer(async (req, res) => {
	console.log(req.method, req.url);

	if (req.url == '/') {
		if (req.method == 'POST'){
			try {
				await formidable({
					uploadDir: 'files/',
					maxFields: 0,
					maxFieldsSize: 0,
					maxFiles: 1,
					maxFileSize: Infinity,
					keepExtensions: true,
					filename: (name, ext, part, form) => {
						let i = 2;

						if (!existsSync('./files/' + name + ext)) return name + ext;
						while (existsSync('./files/' + name + i + ext)) i++;

						return name + i + ext;
					}
				}).parse(req);
			} catch (e) {
				console.error(e);
			}
		}

		let contents = readdirSync('files/');
		let listing = '';

		for (let i = 0; i < contents.length; i++){
			listing += `<a href="${contents[i]}">${contents[i]}</a><br>`;
		}

		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(readFileSync('html/index.html').toString().replace('_1', listing).replace('_3', cfg.addr).replace('_4', cfg.port));
	} else if (req.url == '/styles.css') {
		res.writeHead(200, { 'Content-Type': 'text/css' });
		res.end(readFileSync('html/styles.css'));
	} else {
		res.statusCode = 200;

		try {
			const file = decodeURIComponent(req.url);
			res.setHeader('Content-Type', types[file.split('.').at(-1)] ?? 'application/octet-stream');
			res.end(readFileSync('./files' + file));
		} catch {
			res.statusCode = 302;
			res.setHeader('Location', '/');
			res.end();
		}
	}
});

server.listen(cfg.port, cfg.addr, () => {
	console.log(`Listening on ${cfg.addr}:${cfg.port}`);
});
