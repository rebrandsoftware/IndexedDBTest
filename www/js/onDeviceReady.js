// Call onDeviceReady when PhoneGap is loa ded.
          //
          // At this point, the document has loaded but phonegap-1.0.0.js has not.
          // When PhoneGap is loaded and talking with the native device,
          // it will call the event `deviceready`.
          // 
          Device.initialize(function(success) {
             if (Device.platform === "Browser") {
                 onDeviceReady();
             } else {
                 document.addEventListener("deviceready", onDeviceReady, false);
                // PhoneGap is loaded and it is now safe to make calls PhoneGap methods    
             }
          });
    
          function onDeviceReady() {
            console.log("[Device Ready]");
            
            
            
            
            
          }
          