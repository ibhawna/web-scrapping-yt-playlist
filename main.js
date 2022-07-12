const puppeteer = require("puppeteer");
const pdfkit = require("pdfkit");
const fs = require("fs"); 
let currentTab;
let url =
  "https://www.youtube.com/playlist?list=PL049m_zohJbXT1BIfhjXjLZNI3teQV-m5";

(async function () {
  try {
    let browserOpen = puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"], // open the full big tab
    });

    let browserInstance = await browserOpen;
    let allTabsArray = await browserInstance.pages();

    currentTab = allTabsArray[0]; // open this tab on first

    await currentTab.goto(url); // to link to the youtube playlist

    await currentTab.waitForSelector("h1#title"); // title


    // name
    let name = await currentTab.evaluate(function (select) {
      return document.querySelector(select).innerText;
    }, "h1#title"); // can pass function and other argument(Selector)
    console.log(name);


    // stats
    let allStats = await currentTab.evaluate(getStats, "#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer");
    // " " part will take us to the required info on the page.
    console.log( allStats.countVideos, allStats.countViews);



    // for scrolling: find total videos so that we can know how many times we have to scroll

    let totalVideos = allStats.countVideos.split(" ")[0];
    console.log(totalVideos);
        
    let currentVideos = await currentVideosLength();
    console.log(currentVideos);
    // give us in one scroll how many videos are loaded.

    while (totalVideos - currentVideos >= 20) {
      await scrollTillEnd()
      currentVideos =await currentVideosLength();
  }


  // get the videos pdf
  let videosPDF = await videoStats();
  // console.log(videosPDF);
  let pdfVideos = new pdfkit;
  pdfVideos.pipe(fs.createWriteStream('playlist.pdf'));
  pdfVideos.text(JSON.stringify(videosPDF));
  pdfVideos.end();
  







  } catch (error) {
    console.log(error)
  }
})();



function getStats(selector) {
  let allElements = document.querySelectorAll(selector);
  let countVideos = allElements[0].innerText;
  let countViews = allElements[1].innerText;

  return {
      countVideos,
      countViews
  }
}



// automatic scrolling feature:
// get current videos length and how many videos are there and how many scroll we need 


async function currentVideosLength() {
  let length = await currentTab.evaluate(getLength, "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
  // the argument is the thumbnails' time status 
  return length;
}

function getLength(videoDuration) {
  // length on the basis of their duration
  let durationElement = document.querySelectorAll(videoDuration);
  // will sum up all current videos duration // array of all duration
  return durationElement.length;
}


// scrollToBottom function
async function scrollTillEnd(){
  await currentTab.evaluate(goTillEnd)
  function goTillEnd(){
    window.scrollBy(0, window.innerHeight);
  }
}




// pdf
async function videoStats()
{
    let list = await currentTab.evaluate(nameAndDuration, "#video-title", "#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer");
    // the argument will be video title and the thumbnail time status // videoSelector and durationSelector
    // # -> video-title
    // # -> container -> videoDuration
    return list;

}
function nameAndDuration(videoSelector, durationSelector) {
    let videoElem = document.querySelectorAll(videoSelector); // this element will get video title
    let durationElem = document.querySelectorAll(durationSelector); // this element will get video duration

    let currentList = []; // in the array

    // for every video, get the name and title
    // upto videoElement or durationElement
    for (let i = 0; i < durationElem.length; i++){
        let videoTitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;
        currentList.push({ videoTitle, duration });
    }
    return currentList; // array of objects
}

