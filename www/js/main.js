//main
/*jshint -W083 */
var app = {
    saveSetting: function(name, value, callback) {
        this.store.saveSetting(name, value, function(success) {
            if (callback !== undefined) {
                callback(success);
            }
        });
    },

    getSetting: function(name, sDefault, callback) {
        var s;
        var l;
        var ret;
        //console.log("name: " + name);
        this.store.getSetting(name, sDefault, function(setting) {
            //console.log("value: " + setting);
            callback(setting);
        });
    },
    
    addPlayer: function(player, callback) {
        this.store.addPlayer(player, function(success) {
           console.log("Added Player: " + success);
           callback(success); 
        });  
    },
    
    deletePlayerById: function(id, callback) {
        this.store.deletePlayerById(id, function(success) {
           console.log("Hid player: " + success); 
        });
    },
    
    deletePlayerByIdForever: function(id, callback) {
        this.store.deletePlayerByIdForever(id, function(success) {
           console.log("Deleted player: " + success); 
        });
    },
    
    findPlayerById: function(id, callback) {
        this.store.findPlayerById(id, function(player) {
            callback(player); 
        });  
    },
    
    findAllPlayers: function(callback) {
        this.store.findAllPlayers(false, false, function(players) {
           console.log("Found Players:");
           console.log(players); 
        });
    },

    initialize: function(callback) {
        //console.log("[APP] Initialize");
        this.indexedDb=null;
        this.oldStore=null;
        this.oldLocalStore=null;
        this.currPlayersHidden=[];
        
        if (window.indexedDB !== undefined) {
            this.oldLocalStore = new LocalStore(
                function storeCreated(success) {
                    console.log("old localStorage store created");
                },
                function LocalStoreError(errorMessage) {
                    alertDebug('Error: ' + errorMessage);
                });
                
            this.store = new myIndexedDB(
                function indexCreated(success) {
                    console.log("IndexedDB created");
                    var p = new Player("MikeGibson", "rebrandsoftware", "MikeKGibson", "Mike", "1", false);
                },
                function indexError(errorMessage) {
                    alertDebug('Error: ' + errorMessage);
                });
        } else if (window.localStorage !== undefined) {

            this.store = new LocalStore(
                function storeCreated(success) {
                    console.log("store created");
                },
                function LocalStoreError(errorMessage) {
                    alertDebug('Error: ' + errorMessage);
                });
        } else {
            alert("No storage available!");   
        }
        
        $('#btnSavePlayer').on('click', function() {
            var p = new Player("MikeGibson", "rebrandsoftware", "MikeKGibson", "Mike", "1", false);
            app.addPlayer(p, function(success) {
                
            });
        });
        
        $('#btnHidePlayer').on('click', function() {
            app.deletePlayerById("MikeGibson", function(success) {
               console.log("Hide: " + success); 
            });
        });
        
        $('#btnDelPlayerForever').on('click', function() {
            app.deletePlayerByIdForever("MikeGibson", function(success) {
               console.log("Deleted: " + success); 
            });
        });
        
        $('#btnSavePlayer2').on('click', function() {
            var p = new Player("JenGibson", "leeahyee", "jleegibson", "Jen", "1", false);
            app.addPlayer(p, function(success) {
                
            });
        });
        
        $('#btnGetPlayer').on('click', function() {
            app.findPlayerById("MikeGibson", function(player) {
                console.log("Found:");
                console.log(player);
            });
            
        });
        
        $('#btnGetPlayer2').on('click', function() {
            app.findPlayerById("JenGibson", function(player) {
                console.log("Found:");
                console.log(player);
            });
            
        });
        
        $('#btnGetPlayers').on('click', function() {
            app.findAllPlayers(function(players) {
                console.log("Found:");
                console.log(players);
            });
            
        });
        
        $('#btnGetSetting').on('click', function() {
            app.getSetting("Test", "Nothing", function(setting) {
               console.log("Got setting: " + setting); 
            });
        });
        
        $('#btnSaveSetting').on('click', function() {
            app.saveSetting("Test", "I drink your milkshake", function(success) {
               console.log("Saved Setting: " + success); 
            });
            
            var player = new Player("Test", "", "TestTestTest", "Test", "1", false);
            
            app.store.addPlayer(player, function(success) {
                console.log("Added player: " + success);
            });
            
            var score = new Score(11111, 22222, "MikeGibson", 123, true, "Red", "Team", "Faction", 1);
            
            app.store.addScore(score, function(success) {
                console.log("Added score: " + success);
            });
            
            var game = new Game("Agricola", "12345", "Agricola", "1", "Points", "", 1);
            app.store.addGame(game, function(success) {
                console.log("Added game: " + success);
            });
            
            var gameDetails = new GameDetails("Agricola");
            console.log("GameDetails: " );
            console.log(gameDetails);
            console.log(JSON.stringify(gameDetails));
            
            app.store.addPaused(gameDetails, function(success) {
                console.log("Added paused: " + success);
            });
            
            var session = new Session(22222, "Agricola", "2014-01-01", "Some notes", "", true, "Home", 123);
            
            app.store.addSession(session, function(success) {
                console.log("Added session: " + success);
            });
            
            var award = new Award("1", "Wins", "Total wins", 1);
            
            app.store.addAward(award, function(success) {
                console.log("Added award: " + success);
            });
            var awardEarned = new AwardEarned(11111, 33333, 1, "Agricola", "MikeGibson", 22222, "2014-01-01", "");
            app.store.addAwardEarned(awardEarned, function(success) {
                console.log("Added awardEarned: " + success);
            });
            var cloud = new Cloud(55555, 34, "Mike");
            app.store.addCloud(cloud, function(success) {
                console.log("Added cloud: " + success);
            });
            var cloudBlob = new CloudBlob("Yo");
            app.store.addCloudBlob(cloudBlob, function(success) {
                console.log("Added cloudBlob: " + success);
            });
            var faction = new Faction("Faqirs", "7Wonders");
            app.store.addFaction(faction, function(success) {
                console.log("Added faction: " + success);
            });
            var team = new Team("Bennifer");
            app.store.addTeam(team, function(success) {
                console.log("Added team: " + success);
            });
            var location = new Location("Mike and Jen");
            app.store.addLocation(location, function(success) {
                console.log("Added location: " + success);
            });
            
        });
        
        //console.log("[APP] Initialize Complete");
        if (callback) {
            callback(true);   
        }
    }
    
    
};

app.initialize();

