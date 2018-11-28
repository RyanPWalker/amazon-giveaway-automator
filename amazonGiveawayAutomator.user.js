// This is a Greasemonkey script and must be run using a Greasemonkey-compatible browser.
//
// ==UserScript==
// @name         Amazon Giveaway Bot
// @version      2.0
// @author       Ryan Walker
// @updateURL    https://github.com/RyanPWalker/amazon-giveaway-automator/raw/master/amazonGiveawayAutomator.user.js
// @description  Automates Amazon giveaway entries
// @match        https://www.amazon.com/ga/*
// @match        https://www.amazon.com/ap/signin*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at document-start
// ==/UserScript==



(function() {

  var mytemplate = {};

  mytemplate["controls.html"] = "<div id=\"container\"\n" +
    "	style=\"font-family: Roboto,\\'Helvetica Neue\\',Helvetica,Arial,sans-serif;font-size: 100%;padding: 5px; overflow: hidden; width: 400px; color: white; background-color: #232f3e; border-color: #232f3e; border-width: 2px; border-style: solid; z-index: 9999; text-align: center; display: flex; flex-direction: column; justify-content: center;\">\n" +
    "	<h3 class=\"textColor\" style=\"padding-top: 0; margin-top: 0;\">Amazon Giveaway Automator</h3>\n" +
    "\n" +
    "		<span id=\"numEntered\"></span>\n" +
    "		<span id=\"currentSessionGiveawaysEntered\"></span>\n" +
    "		<button id=\"run\">Start Automator (opens in new window)</button>\n" +
    "		<button id=\"disable\">Stop Automator</button>\n" +
    "\n" +
    "</div>\n" +
    "";

  if(!GM_getValue("giveawaysEntered")) {
    GM_setValue("giveawaysEntered", 0)
  }

  if(!GM_getValue("running")){
      function dragElement(elmnt) {
          var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
          elmnt.onmousedown = dragMouseDown;

          function dragMouseDown(e) {
              e = e || window.event;
              e.preventDefault();
              // get the mouse cursor position at startup:
              pos3 = e.clientX;
              pos4 = e.clientY;
              document.onmouseup = closeDragElement;
              // call a function whenever the cursor moves:
              document.onmousemove = elementDrag;
          }

          function elementDrag(e) {
              e = e || window.event;
              e.preventDefault();
              // calculate the new cursor position:
              pos1 = pos3 - e.clientX;
              pos2 = pos4 - e.clientY;
              pos3 = e.clientX;
              pos4 = e.clientY;
              // set the element's new position:
              elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
              elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
          }

          function closeDragElement() {
              /* stop moving when mouse button is released:*/
              document.onmouseup = null;
              document.onmousemove = null;
          }
      }

    // wrapped this in a page load event handler since it would execute before page loaded
    document.addEventListener("DOMContentLoaded", function(event) {
        var newHTML = document.createElement('div');
        newHTML.style.position = "absolute";
        newHTML.style.left = 'calc(50% - 200px)';
        newHTML.style.top = 150 + 'px';
        newHTML.style.zIndex = 9999;
        newHTML.innerHTML = mytemplate["controls.html"];
        document.body.appendChild(newHTML);
        dragElement(newHTML);
        document.getElementById("run").style.display = (GM_getValue("running") ? 'none' : 'block');
        document.getElementById("disable").style.display = (GM_getValue("running") ? 'block' : 'none');
        document.getElementById("currentSessionGiveawaysEntered").style.display = (GM_getValue("running") ? 'block' : 'none');
        document.getElementById("numEntered").innerHTML = GM_getValue("giveawaysEntered") + ' Total Giveaways Entered';
        document.getElementById("currentSessionGiveawaysEntered").style.display = 'none'

        var automatorWindow

        document.getElementById("run").onclick = function () {
            GM_setValue("running", true);
            GM_setValue("processingGiveaways", false)
            GM_setValue("currentSessionGiveawaysEntered", 0)
            GM_setValue("currentIdx", 0)
            GM_setValue("mainPageUrl", window.location.href)
            //GM_setValue("pageId", 1);

            document.getElementById("run").style.display = 'none';
            document.getElementById("disable").style.display = 'block';
            document.getElementById("currentSessionGiveawaysEntered").style.display = 'block';
            automatorWindow = window.open(window.location.href, '_blank', 'height=500,width=500')
            setInterval(function() {
                document.getElementById("currentSessionGiveawaysEntered").innerHTML = GM_getValue("currentSessionGiveawaysEntered") + ' Giveaways Entered This Session';
                document.getElementById("numEntered").innerHTML = GM_getValue("giveawaysEntered") + ' Total Giveaways Entered';
                if(automatorWindow.closed && GM_getValue("running") ) {
                    GM_setValue("running", false)
                    GM_setValue("processingGiveaways", false)
                    document.getElementById("currentSessionGiveawaysEntered").style.display = 'none';
                    document.getElementById("disable").style.display = 'none';
                    document.getElementById("run").style.display = 'block';
                }
            }, 1000);
            window.addEventListener('unload', () => {
                if(!automatorWindow.closed)
                    automatorWindow.close()
                GM_setValue("running", false)
                GM_setValue("processingGiveaways", false)
            }, false);
        }

        document.getElementById("disable").onclick = function () {
            GM_setValue("running", false)
            GM_setValue("processGiveaways", false)
            document.getElementById("currentSessionGiveawaysEntered").style.display = 'none';
            document.getElementById("disable").style.display = 'none';
            document.getElementById("run").style.display = 'block';
            automatorWindow.close()
        }
    });
  }

    // run script on page load
  window.addEventListener('DOMContentLoaded', main, false);

  var isSignIn = window.location.href.includes("/ap/signin")
  var isMainPage = window.location.href.includes("/ga/giveaways")
  var isGiveaway = window.location.href.indexOf('ga/p') !== -1;

  function getGiveaways() {
    setTimeout(function() {
      console.log('Getting giveaways');
      var giveawayItems = document.querySelectorAll("a.a-link-normal.item-link");
      if (giveawayItems.length === 0) {
          // amazon has different variations of the page....
          giveawayItems = document.querySelectorAll('a.a-link-normal.giveAwayItemDetails');
      }
      giveawayItems.forEach((item, idx) => {
          GM_setValue(`giveaway-${idx}`, JSON.stringify(item.href))
      })
      processGiveaways();
    }, 1500);
  }

  async function processGiveaways() {
    console.log('Processing giveaways');
    GM_setValue("processingGiveaways", true)
    let idx = GM_getValue("currentIdx");
    let currentGiveaway = JSON.parse(GM_getValue(`giveaway-${idx}`))
    GM_setValue(`giveaway-${idx}`, false)
    idx += 1
    GM_setValue("currentIdx", idx)
    if(idx <= 23){
      if (currentGiveaway === false) {
          console.log('Something went wrong.  Perhaps part of the script is deprecated since Amazon is always changing their website. Try refreshing and/or restarting the script. If that doesn\'t work, ask a developer or send me an email and I\'ll take a look.');
      } else {
          window.location.href = currentGiveaway;
      }
    } else {
      window.location.href = GM_getValue("mainPageUrl")
    }
  }

  async function enterGiveaway(){
    console.log('Entering giveaway');
    let numEntered = GM_getValue("giveawaysEntered")
    numEntered += 1
    GM_setValue("giveawaysEntered", numEntered)
    numEntered = GM_getValue("currentSessionGiveawaysEntered")
    numEntered += 1
    GM_setValue("currentSessionGiveawaysEntered", numEntered);

    // fix for repeated call to handleSubmit()
    let alreadyWon = false;
    setInterval( () => {
      // if giveaway has video requirement, click the continue entry button first
      if((document.getElementById("giveaway-video-watch-text") || (document.getElementById("giveaway-youtube-video-watch-text") && !document.querySelector(".continue_button_inner").disabled))){
          document.querySelector(".continue_button_inner").click();
          handleSubmit()
      }
      // don't enter givaways with follow requirements
      else if (document.getElementById('en_fo_follow-announce')) {
        processGiveaways()
      }
      // enter subscription giveaways
      else if (document.getElementById('ne_sub_subscribe-announce')) {
        document.querySelector('input.a-button-input').click();
        handleSubmit();
      }
      // otherwise, enter giveaway immediately
      else {
          if(document.querySelector("#ts_en_enter")){
            document.querySelector("#ts_en_enter span input").click();
            handleSubmit();
          }
          if(document.querySelector(".boxClickTarget")){
            document.querySelector(".boxClickTarget").click()
            alreadyWon = true;
            handleSubmit();
          }
          // TODO: verify handler for subscribe giveaways
          if (document.getElementById('submitForm')) {
            if (document.getElementById('submitForm').innerHTML.includes('Subscribe')) {
                document.getElementById('submitForm').click();
                handleSubmit();
            }
          }
          // If it's something we've already won, move on
          if(document.getElementById('title') && !alreadyWon){
            handleSubmit();
          }
          if (document.querySelector('#giveaway-eni-container')) {
              if (document.querySelector('#giveaway-eni-container').innerHTML.includes('cannot win another')) {
                  processGiveaways();
              }
          }
      }
    }, 1000)
    // fallback to refresh if it gets stuck
    setTimeout(function() {
        console.log("refreshing");
        location.reload();
    }, 20000);
  }

  // check page until results show up then continue to next giveaway in queue if not a winner
  function handleSubmit(){
      if(document.getElementById('title')){
        if(document.getElementById('title').innerHTML.includes('won')){
          // setInterval( () => GM_notification("You just won an Amazon giveaway!", "Amazon Giveway Automator"), 5000)
          if (document.getElementById('lu_co_ship_box-announce')) {
            document.getElementById('lu_co_ship_box-announce').click()
          }
          processGiveaways()
          return
        } else {
          processGiveaways()
          return
        }
        return
      }
  }

  function main() {
    if(GM_getValue("running")){
      if(isSignIn){
        setInterval(() => {
            // Bug fix for Chrome's autofill not filing until you click on something
            if (document.querySelector("input#ap_password.a-input-text.a-span12.auth-autofocus.auth-required-field")) {
                console.log('simulating mouse click');
                function simulate(element, eventName) {
                    var options = extend(defaultOptions, arguments[2] || {});
                    var oEvent, eventType = null;

                    for (var name in eventMatchers) {
                        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
                    }

                    if (!eventType)
                        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

                    if (document.createEvent) {
                        oEvent = document.createEvent(eventType);
                        if (eventType == 'HTMLEvents') {
                            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
                        }
                        else {
                            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                                                  options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                                                  options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
                        }
                        element.dispatchEvent(oEvent);
                    } else {
                        options.clientX = options.pointerX;
                        options.clientY = options.pointerY;
                        var evt = document.createEventObject();
                        oEvent = extend(evt, options);
                        element.fireEvent('on' + eventName, oEvent);
                    }

                    if (document.querySelector(".a-row.a-color-base")) {
                        document.querySelector(".a-row.a-color-base").click();
                    }
                    if (document.querySelector("input#signInSubmit.a-button-input")) {
                        document.querySelector("input#signInSubmit.a-button-input").click();
                    }

                    return element;
                }

                function extend(destination, source) {
                    for (var property in source)
                        destination[property] = source[property];
                    return destination;
                }

                var eventMatchers = {
                    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
                    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
                }
                var defaultOptions = {
                    pointerX: 0,
                    pointerY: 0,
                    button: 0,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    bubbles: true,
                    cancelable: true
                }
                simulate(document.getElementById("ap_password"), "click");
                //document.querySelector("input#ap_password.a-input-text.a-span12.auth-autofocus.auth-required-field").focus();
                //document.querySelector("input#ap_password.a-input-text.a-span12.auth-autofocus.auth-required-field").click();
            } else {
                console.log("else");
                if (document.querySelector(".a-row.a-color-base")) {
                    document.querySelector(".a-row.a-color-base").click();
                }
                if (document.querySelector("input#signInSubmit.a-button-input")) {
                    document.querySelector("input#signInSubmit.a-button-input").click();
                }
            }
        }, 5000)
      } else if(isMainPage){
        GM_setValue("mainPageUrl", window.location.href)
        if(GM_getValue("currentIdx") > 23){
          console.log('Navigating to next list of items.');
          GM_setValue("processingGiveaways", false)
          GM_setValue("currentIdx", 0)
          // Better than clicking on the buttons would be to just change url by pageId
          /*const pageId = GM_getValue('pageId') + 1;
          console.log('checking pageid', pageId);
          GM_setValue('padeId', pageId);
          window.location.href = `/ga/giveaways?pageId=${pageId}`;*/
          setTimeout(function() {
              // amazon has different variations of the same button...
              if (document.getElementById('pagination_buttonNext →')) {
                  document.getElementById('pagination_buttonNext →').click();
                  location.reload();
              } else if (document.querySelector("li.a-last a")) {
                  document.querySelector("li.a-last a").click();
              }
          }, 2000);
        } else {
          getGiveaways();
        }
      } else if(isGiveaway){
        // if giveaway has already been entered, continue on to next giveaway in queue
        if(document.querySelector("#giveaway-ended-header") || (document.getElementById('title') && !document.getElementById('title').innerText.includes('won'))){
          processGiveaways()
        }
        // if giveaway has follow requirement, don't enter
        else if(document.getElementById("ts_en_fo_follow-announce")){
          processGiveaways()
        }
        // handle giveaways with video requirement
        else if (document.getElementById("giveaway-youtube-video-watch-text") || document.getElementById("giveaway-video-watch-text") || document.getElementById('enter-youtube-video-button')){
          console.log('Playing video.');
          // Mute a singular HTML5 element
          function muteMe(elem) {
            elem.muted = true;
          }
          // Try to mute all video and audio elements on the page
          function mutePage() {
            document.querySelectorAll("video").forEach( video => muteMe(video) );
            document.querySelectorAll("audio").forEach( audio => muteMe(audio) );
          }
          window.addEventListener('load', () => {
            if(document.querySelector(".continue_button_inner") || document.querySelector('button.ytp-large-play-button.ytp-button') || document.querySelector("div.airy-play-toggle-hint.airy-hint.airy-play-hint")){
              console.log('clicking play');
              if(document.querySelector(".airy-play-toggle-hint.airy-hint.airy-play-hint")){
                document.querySelector(".airy-play-toggle-hint.airy-hint.airy-play-hint").click()
                mutePage();
              }
              if (document.querySelector('button.ytp-large-play-button.ytp-button')) {
                document.querySelector('button.ytp-large-play-button.ytp-button').click();
                mutePage();
              }
              if (document.querySelector("div.airy-play-toggle-hint.airy-hint.airy-play-hint")) {
                  document.querySelector("div.airy-play-toggle-hint.airy-hint.airy-play-hint").click();
                  mutePage();
              }
              setTimeout(enterGiveaway, 15000)
            }
          }, false);
        }
        // if giveaway has no requirements, enter it
        else {
          enterGiveaway()
        }
      }
    }
  }

})();
