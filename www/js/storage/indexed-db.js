var idbSetObj = function(value, table, callback) {
    console.log("idbSetObj: " + value + ": " + table);
    try {
        var db = myIndexedDB.db;
          var trans = db.transaction([table], "readwrite");
          var store = trans.objectStore(table);
          var request = store.put(value);
        
          trans.oncomplete = function(e) {
                console.log("Added " + table);
                callback(true);
          };
        
          request.onerror = function(e) {
              console.log("Error");
              console.log(e);
              callback(false);
          };
    } catch (err) {
        Toast.toast("Could not save data: index full. See Settings > Delete to clear space.");
        CloudAll.abort = true;
        console.log(err);
        callback(false);
    }

};

var idbGetObj = function(id, table, callback) {
    console.log("idbGetObj: " + id + ": " + table);
    var db = myIndexedDB.db;
        var trans = db.transaction([table], "readwrite");
        var store = trans.objectStore(table);
        var keyRange = IDBKeyRange.only(id);
        var cursorRequest = store.openCursor(keyRange);
    
        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if (result) {
                console.log("Got: " + result.value);
                callback(result.value);   
            } else {
                console.log("Got: NULL");
                callback(null);
            }
        };
    
      cursorRequest.onerror = function(e) {
          console.log("Error");
              console.log(e);
              callback(false);
      };
};

var idbFindObjs = function(tableName, keyRangeObj, indexName, maxRecords, sortOrder, callback) {
    console.log("idbFindObjs: " + tableName + " " + indexName + " " + maxRecords + " " + sortOrder);
    var count=0;
    var max;
    
    if (maxRecords === 0) {
        max = 100000000;
    } else {
        max = maxRecords;
    }
    
    var objs = [];
    var db = myIndexedDB.db;
    var trans = db.transaction([tableName], "readwrite");
    var store = trans.objectStore(tableName);
    
    var cursorRequest;
    if (!indexName) {
        cursorRequest = store.openCursor(keyRangeObj, sortOrder);   
    } else {
        var myIndex = store.index(indexName);
        cursorRequest = myIndex.openCursor(keyRangeObj, sortOrder);
    }

    cursorRequest.onsuccess = function(e) {
        var result = e.target.result;
        if (result) {
            console.log("Found: " + result.value);
            objs.push(result.value);   
            count++;
            if (count < max) {
                        result.continue();   
            } else {
                callback(objs);
            }
        } else {
            console.log("COMPLETE");
            callback(objs);
        }
        
    };

  cursorRequest.onerror = function(e) {
      console.log("Error");
          console.log(e);
          callback(false);
  };
};

var idbDelObj = function(id, table, callback) {
    console.log("idbDelObj: " + id + ": " + table);
  var db = myIndexedDB.db;
  var trans = db.transaction([table], "readwrite");
  var store = trans.objectStore(table);

  var request = store.delete(id);

  trans.oncomplete = function(e) {
      console.log("Deleted");
    callback(true);
  };

  request.onerror = function(e) {
    console.log("Error");
    console.log(e);
    callback(false);
  };  
};

var idbDelObjs = function(tableName, keyRangeObj, indexName, maxRecords, callback) {
    console.log("idbDelObjs: " + tableName + " " + indexName + " " + maxRecords);
    var max;
    
    if (maxRecords === 0) {
        max = 100000000;
    } else {
        max = maxRecords;
    }

    var db = myIndexedDB.db;
    var trans = db.transaction([tableName], "readwrite");
    var store = trans.objectStore(tableName);
    
    var cursorRequest1;
    var cursorRequest2;
    if (!indexName) {
        cursorRequest1 = store.openCursor(keyRangeObj);   
    } else {
        var myIndex = store.index(indexName);
        cursorRequest2 = myIndex.openKeyCursor(keyRangeObj);
    }

    cursorRequest1.onsuccess = function(e) {
        var result = e.target.result;
        if (result) {
            cursorRequest1.delete();
            cursorRequest1.continue();
        } else {
            console.log("COMPLETE");
            callback(true);
        }
        
    };

  cursorRequest1.onerror = function(e) {
      console.log("Error");
          console.log(e);
          callback(false);
  };

    cursorRequest2.onsuccess = function(e) {
        var result = e.target.result;
        if (result) {
            store.delete(result.primaryKey);
            cursorRequest2.continue();
        } else {
            console.log("COMPLETE");
            callback(true);
        }
        
    };

  cursorRequest2.onerror = function(e) {
      console.log("Error");
          console.log(e);
          callback(false);
  };
};

var idbGetAutoInc = function(index, callback) {
    console.log("idbGetAutoInc: " + index);
    idbGetObj("autoInc" + index, "Settings", function(s) {
       if (s === undefined || s === null) {
            s = new Setting("autoInc" + index, 0, Globals.mUsername);
            idbSetObj(s, 'Settings', function(success) {
                console.log("Got: " + s.settingValue);
               callback(s.settingValue); 
            });
        } else {
            s.settingValue++;
            idbSetObj(s, "Settings", function(success) {
                console.log("Got: " + s.settingValue);
                callback(s.settingValue);
            });
        } 
    });
};

var idbSetAutoInc = function(index, myValue, callback) {
    console.log("idbSetAutoInc: " + index + myValue);
    var s = new Setting("autoInc" + index, myValue, Globals.mUsername);
    idbGetAutoInc(index, function(i) {
        if (myValue > i) {
            console.log("Set auto inc");
            idbSetObj(s, "Settings", function(success) {
               callback(success); 
            });
        } else {
            console.log("Did not set auto inc: " + myValue + " < " + i);
            callback(true);
        }
    });

};

var myIndexedDB = function(successCallback, errorCallback) {
    "use strict";
    this.db = null;
    this.dbName = "ScoreGeek";
    this.onerror = function(e) {
        console.log("[indexedDB Error]");
        console.log(e);
    };

    this.initializeIndex = function(successCallback, errorCallback) {
        console.log("[myIndexedDB] InitializeIndex");

        if (window.indexedDB !== undefined) {
            console.log("indexedDB is ACTIVE");

            var version = 7;
            var request = indexedDB.open(this.dbName, version);

            // We can only create Object stores in a versionchange transaction.
            request.onupgradeneeded = function(e) {
                console.log("upgradeneeded");
                var db = e.target.result;

                // A versionchange transaction is started automatically.
                e.target.transaction.onerror = this.onerror;
                try {
                    //new db
                    var storePlayers = db.createObjectStore("Players", {keyPath: "id"});
                    storePlayers.createIndex('name', 'name', {unique: false});
                    storePlayers.createIndex('hidden', ['hidden', 'hiddenOnDevice'], {unique: false});
                } catch (err) {
                    //upgrade db
                    var storePlayers = e.currentTarget.transaction.objectStore("Players");
                    if (storePlayers.indexNames.contains('name') === false) {
                        storePlayers.createIndex('name', 'name', {unique: false});   
                    }
                }
                
                try {
                    //new db
                    var storeCloudQueue = db.createObjectStore("CloudQueue", {keyPath: "cloudId"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeCloudHistGet = db.createObjectStore("CloudHistGet", {keyPath: "cloudId"});
                    storeCloudHistGet.createIndex('usernames', ['username', 'cloudUsername'], {unique: false});
                } catch (err) {
                    //upgrade db
                    var storeCloudHistGet = e.currentTarget.transaction.objectStore("CloudHistGet");
                    if (storeCloudHistGet.indexNames.contains('usernames') === false) {
                        storeCloudHistGet.createIndex('usernames', ['username', 'cloudUsername'], {unique: false});   
                    }
                }
                
                try {
                    //new db
                    var storeCloudHistPush = db.createObjectStore("CloudHistPush", {keyPath: "cloudId"});
                    storeCloudHistPush.createIndex('usernames', ['username', 'cloudUsername'], {unique: false});
                } catch (err) {
                    //upgrade db
                    var storeCloudHistPush = e.currentTarget.transaction.objectStore("CloudHistPush");
                    if (storeCloudHistPush.indexNames.contains('usernames') === false) {
                        storeCloudHistPush.createIndex('usernames', ['username', 'cloudUsername'], {unique: false});   
                    }
                }

                try {
                    //new db
                    var storeCloudBlob = db.createObjectStore("CloudBlob", {keyPath: "id"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeAwards = db.createObjectStore("Awards", {keyPath: "id"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeAwardsEarned = db.createObjectStore("AwardsEarned", {keyPath: "earnedId"});
                    storeAwardsEarned.createIndex('sessionId', 'sessionId', {unique: false});
                } catch (err) {
                    //upgrade db
                    var storeAwardsEarned = e.currentTarget.transaction.objectStore("AwardsEarned");
                    if (storeAwardsEarned.indexNames.contains('sessionId') === false) {
                        storeAwardsEarned.createIndex('sessionId', 'sessionId', {unique: false});   
                    }
                }
                
                try {
                    //new db
                    var storeGames = db.createObjectStore("Games", {keyPath: "id"});
                    storeGames.createIndex('name', 'name', {unique: false});
                } catch (err) {
                    //upgrade db
                    var storeGames = e.currentTarget.transaction.objectStore("Games");
                    if (storeGames.indexNames.contains('name') === false) {
                        storeGames.createIndex('name', 'name', {unique: false});   
                    }
                }
                
                try {
                    //new db
                    var storeOldGames = db.createObjectStore("OldGames", {keyPath: "id"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeFactions = db.createObjectStore("Factions", {keyPath: "name"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeTeams = db.createObjectStore("Teams", {keyPath: "name"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeLocations = db.createObjectStore("Locations", {keyPath: "name"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storePaused = db.createObjectStore("Paused", {keyPath: "id"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeScores = db.createObjectStore("Scores", {keyPath: "scoreId"});
                    storeScores.createIndex('sessionId', 'sessionId', {unique: false});
                } catch (err) {
                    //upgrade db
                    var storeScores = e.currentTarget.transaction.objectStore("Scores");
                    if (storeScores.indexNames.contains('sessionId') === false) {
                        storeScores.createIndex('sessionId', 'sessionId', {unique: false});   
                    }
                }
                
                try {
                    //new db
                    var storeSessions = db.createObjectStore("Sessions", {keyPath: "sessionId"});
                } catch (err) {
                    //upgrade db
                }
                
                try {
                    //new db
                    var storeSettings = db.createObjectStore("Settings", {keyPath: "settingName"});
                } catch (err) {
                    //upgrade db
                    //db.deleteObjectStore("Settings");
                    var storeSettings = db.createObjectStore("Settings", {keyPath: "settingName"});
                }
            };

            request.onsuccess = function(e) {
                console.log("request success");
                console.log(e.target.result.objectStoreNames);
                myIndexedDB.db = e.target.result;
                successCallback(true);
            };
            
        } else {
            // Sorry! No web storage support..
            console.log("indexedDB is ....INACTIVE");
            errorCallback("No indexedDB support");
        }
    };
    
    this.forceAutoInc = function(index, value) {
        console.log("[myIndexedDB] forceAutoInc");
        idbSetAutoInc(index, value, function(success) {
            
        });
    };

    this.saveSetting = function(settingName, settingValue, callback) {
        console.log("[myIndexedDB] saveSetting: " + settingName + " " + settingValue);
        var s = new Setting(settingName, settingValue, Globals.mUsername);
        idbSetObj(s, "Settings", function(success) {
            if (callback !== undefined) {
                callback(success);
            } 
        });
    };

    this.getSetting = function(settingName, settingDefault, callback) {
        console.log("[myIndexedDB] getSetting: " + settingName);
        idbGetObj(settingName, "Settings", function(s) {
            if (s) {
                callback(s.settingValue);
            } else {
                callback(settingDefault);
            } 
        });
    };
    
    this.addCloud = function(myCloud, callback) {
        console.log("[myIndexedDB] addCloud");
        idbSetObj(myCloud, "CloudQueue", function(success) {
            callback(success); 
        });
    };

    this.addCloudAutoInc = function(cloudId) {
        console.log("[myIndexedDB] addCloudAutoInc: " + cloudId);
        idbSetAutoInc("CloudQueue", cloudId, function(success) {
            
        });
    };

    this.addCloudBlob = function(myCloudBlob, callback) {
        console.log("[myIndexedDB] addCloudBlob");
        idbSetObj(myCloudBlob, "CloudBlob", function(success) {
            callback(success); 
        });
    };

    this.addAward = function(myAward, callback) {
        console.log("[myIndexedDB] addAward");
        idbSetObj(myAward, "Awards", function(success) {
            callback(success);
        });
    };

    this.addAwardEarned = function(awardEarned, callback) {
        console.log("[myIndexedDB] addAwardEarned");
        idbSetObj(awardEarned, "AwardsEarned", function(success) {
            callback(success);
        });
    };

    this.addGame = function(game, callback) {
        console.log("[myIndexedDB] addGame");
        idbSetObj(game, "Games", function(success) {
            callback(success);
        });
    };

    this.addOldGame = function(game, callback) {
        console.log("[myIndexedDB] addOldGame");
        idbSetObj(game, "OldGames", function(success) {
            callback(success);
        });
    };

    this.addPlayer = function(player, callback) {
        console.log("[myIndexedDB] addPlayer");
        idbSetObj(player, "Players", function(success) {
           callback(success); 
        });
    };

    this.addFaction = function(faction, callback) {
        console.log("[myIndexedDB] addFaction");
        idbSetObj(faction, "Factions", function(success) {
            callback(success);
        });
    };

    this.addTeam = function(team, callback) {
        console.log("[myIndexedDB] addTeam");
        idbSetObj(team, "Teams", function(success) {
            callback(success);
        });
    };

    this.addLocation = function(location, callback) {
        console.log("[myIndexedDB] addLocation");
        idbSetObj(location, "Locations", function(success) {
            callback(success);
        });
    };

    this.addPaused = function(details, callback) {
        console.log("[myIndexedDB] addPaused");
        idbSetObj(details, "Paused", function(success) {
            callback(success);
        });
    };

    this.addScore = function(score, callback) {
        console.log("[myIndexedDB] addScore");
        idbSetObj(score, "Scores", function(success) {
            callback(success);
        });
    };

    this.addSession = function(session, callback) {
        console.log("[myIndexedDB] addSession");
        idbSetObj(session, "Sessions", function(success) {
            callback(success);
        });
    };

    this.deletePlayerById = function(player_id, callback) {
        console.log("[myIndexedDB] deletePlayerById");
        idbGetObj(player_id, "Players", function(p) {
           var ret = true;
            if (p) {
                p.hidden = true;
                ret = idbSetObj(p, "Players", function(success) {
                    callback(success); 
                });
            } else {
                callback(true);
            }
        });
    };
    
    this.deletePlayerByIdForever = function(player_id, callback) {
        console.log("[myIndexedDB] deletePlayerByIdForever");
        idbDelObj(player_id, "Players", function(success) {
           callback(success); 
        });
    };

    this.hidePlayerById = function(player_id, callback) {
        console.log("[myIndexedDB] hidePlayerById");
        idbGetObj(player_id, "Players", function(p) {
           var ret = true;
            if (p) {
                p.hiddenOnDevice = true;
                ret = idbSetObj(p, "Players", function(success) {
                    callback(success); 
                });
            } else {
                callback(true);
            }
        });
    };


    this.deleteGameById = function(game_id, callback) {
        console.log("[myIndexedDB] deleteGameById");
        idbGetObj(game_id, "Games", function(g) {
           var ret = true;
            if (g) {
                g.hidden = true;
                ret = idbSetObj(g, "Games", function(success) {
                    callback(success); 
                });
            } else {
                callback(true);
            }
        });
    };

    this.deletePausedById = function(details_id, callback) {
        console.log("[myIndexedDB] deletePausedById");
        idbDelObj(details_id, "Paused", function(success) {
           callback(success); 
        });
    };

    this.deleteGameByIdForever = function(game_id, callback) {
        console.log("[myIndexedDB] deleteGameByIdForever");
        idbDelObj(game_id, "Games", function(success) {
           callback(success); 
        });
    };

    this.deleteSessionBySessionId = function(session_id, callback) {
        console.log("[myIndexedDB] deleteSessionBySessionId");
        idbDelObj(session_id, "Sessions", function(success) {
           callback(success); 
        });
    };

    this.deleteAwardsEarnedBySessionId = function(session_id, callback) {
        console.log("[myIndexedDB] deleteAwardsEarnedBySessionId");
        var tableName="AwardsEarned";
        var keyRange=IDBKeyRange.only(session_id);
        var indexName='sessionId';
        var maxRecords=0;
        idbDelObjs(tableName, keyRange, indexName, maxRecords, function(results) {
            callback(results);  
        });
    };

    this.deleteScoresBySessionId = function(session_id, callback) {
        console.log("[myIndexedDB] deleteScoresBySessionId");
        var tableName="Scores";
        var keyRange=IDBKeyRange.only(session_id);
        var indexName='sessionId';
        var maxRecords=0;
        idbDelObjs(tableName, keyRange, indexName, maxRecords, function(results) {
            callback(results);  
        });
    };

    this.findAllSessions = function(callback) {
        console.log("[myIndexedDB] findAllSessions");
        var tableName="Sessions";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllCloudBlobs = function(callback) {
        console.log("[myIndexedDB] findAllCloudBlobs");
        var tableName="CloudBlob";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllOldGames = function(callback) {
        console.log("[myIndexedDB] findAllOldGames");
        var tableName="OldGames";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllScores = function(callback) {
        console.log("[myIndexedDB] findAllScores");
        var tableName="Scores";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };


    this.findSessionById = function(session_id, callback) {
        console.log("[myIndexedDB] findSessionById");
        idbGetObj(session_id, "Sessions", function(session) {
            callback(session);
        });
    };
    
    this.findNextCloud = function(username, cloudUsername, cloudType, callback) {
        console.log("[myIndexedDB] findNextCloud: " + username + " " + cloudUsername + " " + cloudType);
        var tableName;
        var keyRange;
        var indexName;
        var maxRecords;
        var sortOrder;
        var lastCloudPush;
        switch (cloudType) {
            case "push":
                tableName = "CloudHistPush";
                keyRange = IDBKeyRange.only([username, cloudUsername]);
                indexName = 'usernames';
                maxRecords=1;
                sortOrder='prev';
                idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
                    if (results.length > 0) {
                        lastCloudPush = results[0].cloudId;
                    } else {
                        lastCloudPush = 0;
                    }
                    console.log("lastCloudPush: " + lastCloudPush);
                    tableName = "CloudQueue";
                    keyRange = IDBKeyRange.lowerBound(lastCloudPush, true);
                    indexName = null;
                    maxRecords=1;
                    sortOrder='next';
                    idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
                        if (results.length > 0) {
                            console.log("Cloud to push:");
                            console.log(results[0]);
                            callback(results[0]);
                        } else {
                            callback(null);
                        }
                    });
                });
                break;
            case "get":
                tableName = "CloudHistGet";
                keyRange = IDBKeyRange.only([username, cloudUsername]);
                indexName = 'usernames';
                maxRecords=1;
                sortOrder='prev';
                idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
                    if (results.length > 0) {
                        console.log("CloudToGet;");
                        console.log(results[0]);
                        callback(results[0]);
                    } else {
                        callback(null);
                    }
                });
                break; 
        }
    };

    this.findAwardsBySession = function(session_id, callback) {
        console.log("[myIndexedDB] findAwardsBySession");
        var tableName="Awards";
        var keyRange=IDBKeyRange.only(session_id);
        var indexName='session_id';
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findScoresBySession = function(session_id, callback) {
        console.log("[myIndexedDB] findScoresBySession");
        var tableName="Scores";
        var keyRange=IDBKeyRange.only(session_id);
        var indexName='session_id';
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllAwardsEarned = function(callback) {
        console.log("[myIndexedDB] findAwardsEarned");
        var tableName="AwardsEarned";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllAwards = function(callback) {
        console.log("[myIndexedDB] findAllAwards");
        var tableName="Awards";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllGames = function(bHidden, callback) {
        console.log("[myIndexedDB] findAllGames");
        var tableName="Games";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            if (bHidden === false) {
                var i;
                var l;
                l = results.length;
                for (i = 0; i < l; i++) {
                    if (results[i].hidden === true) {
                        results.splice(i, 1);
                        i--;
                        l--;
                    }
                }
            }
            callback(results);  
        });
    };

    this.findAllPaused = function(callback) {
        console.log("[myIndexedDB] findAllPaused");
        var tableName="Paused";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllTeams = function(callback) {
        console.log("[myIndexedDB] findAllTeams");
        var tableName="Teams";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllLocations = function(callback) {
        console.log("[myIndexedDB] findAllLocations");
        var tableName="Locations";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllFactions = function(callback) {
        console.log("[myIndexedDB] findAllFactions");
        var tableName="Factions";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(results) {
            callback(results);  
        });
    };

    this.findAllPlayers = function(bHidden, bHiddenOnDevice, callback) {
        console.log("[myIndexedDb] findAllPlayers " + bHidden + bHiddenOnDevice);
        var i;
        var l;
        var tableName="Players";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        app.currPlayersHidden = [];
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(players) {
            l = players.length;
            if (bHidden === false) {
                for (i = 0; i < l; i++) {
                    if (players[i].hidden === true) {
                        players.splice(i, 1);
                        i--;
                        l--;
                    }
                }
            }
            l = players.length;
            if (bHiddenOnDevice === false) {
                for (i = 0; i < l; i++) {
                    if (players[i].hiddenOnDevice === true) {
                        app.currPlayersHidden.push(players[i]);
                        players.splice(i, 1);
                        i--;
                        l--;
                    }
                }
            }
            callback(players);  
        });
    };

    this.findGamesByName = function(name, bHidden, callback) {
        console.log("[myIndexedDB] findGamesByName");
        var tableName="Games";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        var s;
        var i;
        var l;
        name = name.toLowerCase();
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(games) {
            l = games.length;
            for (i = 0; i < l; i++) {
                s = games[i].name.toLowerCase();
                if (s.indexOf(name) === -1) {
                    games.splice(i, 1);
                    i--;
                    l--;
                }
            }
            if (bHidden === false) {
                l = games.length;
                for (i = 0; i < l; i++) {
                    if (games[i].hidden === true) {
                        games.splice(i, 1);
                        i--;
                        l--;
                    }
                }
    
            }
            callback(games);  
        });
        
    };

    this.findGameById = function(id, callback) {
        console.log("[myIndexedDB] findGameById");
        idbGetObj(id, "Games", function(game) {
           callback(game); 
        });
    };

    this.findOldGameById = function(id, callback) {
        console.log("[myIndexedDB] findOldGameById");
        idbGetObj(id, "OldGames", function(game) {
           callback(game); 
        });
    };

    this.findOldGamesByName = function(name, callback) {
        console.log("[myIndexedDB] findOldGamesByName");
        var tableName="OldGames";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        var s;
        var i;
        var l;
        name = name.toLowerCase();
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(games) {
            l = games.length;
            for (i = 0; i < l; i++) {
                s = games[i].name.toLowerCase();
                if (s.indexOf(name) === -1) {
                    games.splice(i, 1);
                    i--;
                    l--;
                }
            }
            callback(games);  
        });
    };

    this.findPlayerByName = function(name, bHidden, bHiddenOnDevice, callback) {
        console.log("[myIndexedDB] findPlayerByName");
        var tableName="Players";
        var keyRange=null;
        var indexName=null;
        var maxRecords=0;
        var sortOrder='next';
        var s;
        var i;
        var l;
        name = name.toLowerCase();
        idbFindObjs(tableName, keyRange, indexName, maxRecords, sortOrder, function(players) {
           l = players.length;
            for (i = 0; i < l; i++) {
                s = players[i].name.toLowerCase();
                if (s.indexOf(name) === -1) {
                    players.splice(i, 1);
                    i--;
                    l--;
                }
            }
            l = players.length;
            if (bHidden === false) {
                for (i = 0; i < l; i++) {
                    if (players[i].hidden === true) {
                        players.splice(i, 1);
                        i--;
                        l--;
                    }
                }
            }
            l = players.length;
            if (bHiddenOnDevice === false) {
                for (i = 0; i < l; i++) {
                    if (players[i].hiddenOnDevice === true) {
                        players.splice(i, 1);
                        i--;
                        l--;
                    }
                }
            }
            callback(players); 
        });
    };

    this.findPlayerById = function(id, callback) {
        console.log("[myIndexedDB] findPlayerById");
        idbGetObj(id, "Players", function(player) {
            callback(player);
        });
    };

    this.updatePlayerPhoto = function(player_id, player_icon, callback) {
        console.log("[myIndexedDB] updatePlayerPhoto");
        idbGetObj(player_id, "Players", function(p) {
            
            if (p) {
                p.icon = player_icon;
                p.iconURL = "BLOB";
                idbSetObj(p, "Players", function(success) {
                    if (callback) {
                        callback(success);
                    } 
                });
            } else {
                if (callback) {
                        callback(true);
                    } 
            } 
        });
        
    };



    this.updateSessionPhoto = function(session_id, game_photo, callback) {
        console.log("[myIndexedDB] updateSessionPhoto");
        idbGetObj(session_id, "Sessions", function(s) {
            
            if (s) {
                s.sessionPhoto = game_photo;
                idbSetObj(s, "Sessions", function(success) {
                    if (callback) {
                        callback(success);
                    } 
                });
            } else {
                if (callback) {
                        callback(true);
                    } 
            } 
        });
    };



    this.updateGameIcon = function(game_id, game_icon, callback) {
        console.log("[myIndexedDB] updateGameIcon");
        idbGetObj(game_id, "Games", function(g) {
            if (g) {
                g.icon = game_icon;
                idbSetObj(g, "Games", function(success) {
                    if (callback) {
                        callback(success);
                    }
                });
            } else {
                if (callback) {
                    callback(true);
                }
            }

        });
        
    };


    this.saveCloudQueue = function(cloudData, cloudDataId, cloudIdRemote, cloudBlob, callback) {
        console.log("[myIndexedDB] saveCloudQueue");
        idbGetAutoInc("CloudQueue", function(id) {
            if (cloudDataId === undefined || cloudDataId == "undefined" || cloudDataId === null) {
                cloudDataId = "";
            }
            if (cloudBlob === undefined || cloudBlob == "undefined" || cloudBlob === null) {
                cloudBlob = "";
            }
            if (cloudIdRemote === undefined || cloudIdRemote == "undefined" || cloudIdRemote === null) {
                cloudIdRemote = 0;
            }
            var cloudHasBlob;
            if (cloudBlob === "" || cloudBlob === false || cloudBlob === undefined) {
                cloudHasBlob = 0;
            } else {
                cloudHasBlob = -1;
            }
            var cloudIsBlob = 0;
            var c = new Cloud(id, Globals.mUsername, Globals.appId, cloudIdRemote, id, cloudData, "", "", false, cloudDataId, cloudHasBlob, cloudIsBlob, 1, 1);
            idbSetObj(c, "CloudQueue", function(success) {
                if (callback) {
                    callback(id);
                } 
            });
        });
    };

    this.saveCloudQueueBlob = function(cloudData, cloudIdRemote, cloudPieceId, cloudIdLocal, maxParts, callback) {
        console.log("[myIndexedDB] saveCloudQueueBlob");
        idbGetAutoInc("CloudQueue", function(id) {
            console.log("New Cloud ID: " + id);
            var cloudHasBlob = 0;
            var cloudIsBlob = -1;
            var c = new Cloud(id, Globals.mUsername, Globals.appId, cloudIdRemote, cloudIdLocal, cloudData, "", "", false, "", cloudHasBlob, cloudIsBlob, cloudPieceId, maxParts);
            idbSetObj(c, "CloudQueue", function(success) {
                callback(success);
            });
  
        });
    };

    this.saveCloudBlob = function(blobLocalId, blobData, callback) {
        console.log("[myIndexedDB] saveCloudBlob");
        if (blobData) {
            var id = "cloudBlob" + blobLocalId;
            var c = new CloudBlob(id, blobData, Globals.mUsername, blobLocalId);
            idbSetObj(c, "CloudBlob", function(success) {
               callback(success); 
            });
        }
    };

    this.saveCloudHist = function(cloudIdLocalOrRemote, username, cloudUsername, histType, callback) {
        console.log("[myIndexedDB] saveCloudHist");
        var i = parseInt(cloudIdLocalOrRemote, 10);
        var cloudHist = new CloudHist(i, cloudUsername);
        switch (histType) {
            case "get":
                idbSetObj(cloudHist, "CloudHistGet", function(success) {
                   callback(success); 
                });
                break;
            case "push":
                idbSetObj(cloudHist, "CloudHistPush", function(success) {
                   callback(success); 
                });
                break;
        }
    };

    this.deleteCloudById = function(myCloud, callback) {
        console.log("[myIndexedDB] deleteCloudById");
        if (myCloud.cloudId !== undefined) {
            idbDelObj(myCloud.cloudId, "CloudQueue", function(success) {
               callback(success); 
            });
        } else {
            callback(true);
        }
    };

    this.deleteCloudBlobById = function(cloudBlobId, callback) {
        console.log("[myIndexedDB] deleteCloudBlobById");
        if (cloudBlobId) {
            idbDelObj(cloudBlobId, "CloudBlob", function(success) {
                        callback(success);       
            });
        } else {
            callback(true);
        }
    };

    this.findBlobById = function(localId, callback) {
        console.log("[myIndexedDB] findCloudBlobById");
        idbGetObj(localId, "CloudBlob", function(myBlob) {
            callback(myBlob);    
        });

    };

    this.initializeIndex(successCallback, errorCallback);
};