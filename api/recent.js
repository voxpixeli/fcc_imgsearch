
var https = require("https");
var mongodb = require('mongodb');

var mongoClient = mongodb.MongoClient;


module.exports = function(callback) {
  
  console.log("recent");
  
  mongoClient.connect(process.env.DB_URL, function (err, db) {
    if (!err) {
      console.log("connected");
      db.collection("history", function(err, history) {
        console.log("history");
        var histo = [];
        var cursor = history.find().sort({ "timestamp": -1 }).limit(10);
        cursor.each(function(err, doc) {
          if (doc != null) {
            console.log("add", doc);
            histo.push({ "keywords": decodeURIComponent(doc.keywords)});
          } else {
            console.log("callback", histo);
            callback(histo);
          }
        });
        console.log("close db");
        db.close();
      });
    }
  });
  
}

