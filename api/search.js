
var https = require("https");
var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;

function addHistory(keywords) {
  mongoClient.connect(process.env.DB_URL, function (err, db) {
    if (!err) {
      db.collection("history", function(err, history)
      {
        // keywords already in history ?
        history.findOne({ "keywords": keywords }, function(err, existing)
        {
          var date = new Date();
          if (existing) {
            // update entry timestamp
              db.collection("history").updateOne({ "keywords": keywords }, { "keywords": keywords, "timestamp": date.getTime() });
          } else {
            // add entry
              db.collection("history").insertOne({ "keywords": keywords, "timestamp": date.getTime() });
          }
          db.close();
        });
      });
    }
  });
}

module.exports = function(url, callback) {
  
  const durl = decodeURIComponent(url);
  var keywords = encodeURIComponent(durl.split("?offset")[0]);
  var offset = durl.split("?offset=")[1];
  var count = 10;
  
  if (offset==undefined) offset = 0;
  
  console.log(keywords, offset);
  
  const req = https.get({
        host: 'api.qwant.com'
      , path: '/api/search/images?count='+count+'&offset='+offset+'&q='+keywords
      , headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:55.0) Gecko/20100101 Firefox/55.0'  // trick to avoid error "too many requests"
        }
    }, (res) => {
    
    var data = "";
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', function() {
      var obj = JSON.parse(data);
      var result = [];
      
      for (var i=0; i<obj.data.result.items.length; i++) {
        result.push( { 
          "title": obj.data.result.items[i].title,
          "thumbnail": obj.data.result.items[i].thumbnail,
          "image": obj.data.result.items[i].media,
          "page": obj.data.result.items[i].url,
        });
      }
      
      callback(result);
      addHistory(keywords);
    });
    
  }).on('error', (e) => {
    callback({"error": e});
  });
  
  req.on('error', (e) => {
    callback({"error": e});
  });
  
  req.end();
  
}

