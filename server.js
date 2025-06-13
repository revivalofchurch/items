const net     = require('net');
const express = require('express');
const app     = express();
const http    = require('http').Server(app);
const zlib    = require('zlib');
const fs      = require('fs');
const amfjs   = require('amfjs');
const crypto  = require('crypto');
const exec    = require('child_process').exec;
const web_port  = 8080;
const Readable  = require('stream').Readable;
const Writable  = require('stream').Writable;

app.use(express.static('public'));

var imageArrays = {};

app.get('/iconLayer/:animalType-:iconSize-:layer', function(req, res) {

  var pre = '1636/imageArrays';
  var v = 1;
  var i = 0;
  var pp = "";
  
  var sekret = "W3 7r4Ck h4X0r3rs";
  var hashNum = (req.params.animalType << 24 | req.params.iconSize << 16 | req.params.layer);
  var s = sekret + hashNum;
  
  while (i<s.length) {
    var c=s[i]; pp = (i++%2==0)? pp+c : c+pp;  
  };
  
  var hash = crypto.createHash('md5').update(pp).digest('hex');
  var rs = new Readable;
  var ws = new Writable;
  var decoder = new amfjs.AMFDecoder(rs);

  var url = `https://ajcontent.akamaized.net/${pre}/${hash}?v=${v}`;

  if (imageArrays[url] != undefined) {
      res.writeHead(200, {'Content-Type': 'text/json'});
      res.write(JSON.stringify(imageArrays[url], null, 2));
      res.end();
  }

  var cmd = `curl \"${url}\" -m 2 -H \"Referer: https://www.animaljam.com/game/play\" -H \"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.21 Safari/537.36\" -H \"X-Requested-With: ShockwaveFlash/24.0.0.186\" --compressed`
  exec(cmd, {encoding: 'buffer', maxBuffer: 1024 * 1024}, (err, stdout, stderr) => {
    if (err) { 
      console.log("ERROR!!", err);
      res.writeHead(500, {'Content-Type': 'text/json'});
      res.write(JSON.stringify({error: err}));
      res.end();
      return;
    }
    zlib.inflate(stdout, (zerr, zbuf) => {
      if (zerr) { 
        res.writeHead(500, {'Content-Type': 'text/json'});
        res.write(JSON.stringify({error: zerr}));
        res.end();
        return;
      }
      rs.push(zbuf);
      rs.push(null);

      var obj = decoder.decode();
      imageArrays[url] = obj;

      try {
        res.writeHead(200, {'Content-Type': 'text/json'});
        res.write(JSON.stringify(obj, null, 2));
        res.end();
      } catch(e) {
        console.log(e);
      }
    });
  });

});

http.listen(web_port, () => { console.log(`Listening on ${web_port}`); });