var express = require('express');
var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;

var dotenv = require('dotenv');
dotenv.load();
const GoogleImages = require('google-images');

var app = express();

var db_url = process.env.MONGOLAB_URI;
var cseId = process.env.CSE_ID;
var apiKey = process.env.API_KEY;
const client = new GoogleImages(cseId, apiKey);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/imgSearch/:string', function(req, res){
  var searchString = req.params.string;
  var offset = req.query.offset ? req.query.offset:1;
  var when = new Date();
  client.search(searchString, {page : offset}).then(function(images){
    if(images.length > 0){
      MongoClient.connect(db_url, function (err, db) {
        if(err){
          console.log('Unable to connect to the mongoDB server. Error:', err);
          res.send('Unable to connect to the mongoDB server. Error:', err);
        } else{
          console.log('Connection established to', db_url);
          var imageSearchCollection = db.collection('imgSearchList');
          imageSearchCollection.insert([{term : searchString, when : when}], function(){
            res.json(images);
          });
          db.close();
        }
      });
    } else{
      res.send("Unable to find image, Kindly enter different string");
    }
  });
  
});

app.get('/api/recent/imgSearch', function(req, res){
  MongoClient.connect(db_url, function (err, db) {
        if(err){
          console.log('Unable to connect to the mongoDB server. Error:', err);
          res.send('Unable to connect to the mongoDB server. Error:', err);
        } else{
          console.log('Connection established to', db_url);
          var imageSearchCollection = db.collection('imgSearchList');
          imageSearchCollection.find().sort({when:-1}).toArray(function(err, docs){
            if(err){
              res.send("Unable to fetch data");
            }else{
              res.send(docs);
            }
          });
          db.close();
        }
      });
});

app.listen(process.env.PORT || 8080, function(){
    console.log("file meta data app listening to 8080 || process.env.PORT");
});