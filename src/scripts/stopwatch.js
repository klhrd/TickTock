// src/scripts/stopwatch.js

if (typeof window !== "undefined")
{
    window.addEventListener("DOMContentLoaded",()=>
    {
        loadStopwatches();
        initializeApp();
        renderAll();
        startGlobalTick();
    });
}

const STORAGE_KEY="ticktock_stopwatch_state";
let stopwatches=[];

/*
// 單一 stopwatch 資料結構
{
    id: Date.now(),
    status: "idle", // 'idle' | 'running' | 'paused'
    laps: [
        {
            id: Date.now(),
            startTime: Date.now(),      // 啟動該 Lap 的時刻 (running 時用來算動態時間)
            duration: 0
        }
    ]
}
*/

function initializeApp()
{
    const addBtn=document.querySelector(".stopwatch-adding-action-btn button");
    console.log("add button element: ",addBtn);
    
    if(addBtn)
    {
        addBtn.addEventListener("click",()=>
        {
            console.log("add button clicked");
            handleAddStopwatch();
        });
    }
}

function saveStopwatches()
{
    const cleanStopwatches=stopwatches;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(cleanStopwatches));
}

function loadStopwatches()
{
    const data=localStorage.getItem(STORAGE_KEY);
    stopwatches=data?JSON.parse(data):[];
}

function formatTime(ms)
{
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    const f=ms%1000
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(f).padStart(3,"0")}`
}

function handleAddStopwatch()
{
    const newStopwatch=
    {
        id: Date.now(),
        status: "idle", // 'idle' | 'running' | 'paused'
        laps: []
    }

    stopwatches.push(newStopwatch);
    saveStopwatches();
    renderAll();
}

function handleStart(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if(!stopwatch)return;

    const now=Date.now();

    if(stopwatch.status==="idle")
    {
        const lap={
            id: now,
            startTime: now,
            duration: 0
        }
        stopwatch.laps.push(lap);

        stopwatch.status="running";
    }
    else    // paused
    {
        stopwatch.status="running";
    }
    
    saveStopwatches();
    updateCardUI(stopwatch);
}

function handlePause(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if(!stopwatch)return;

    stopwatch.status="paused";
    saveStopwatches();
    updateCardUI(stopwatch);
}

function handleReset(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;
    
    stopwatch.status="idle";
    stopwatch.remainingSeconds=stopwatch.totalSeconds;
    stopwatch.startTime=null;
    stopwatch.endTime=null;
    
    saveStopwatches();
    updateCardUI(stopwatch);
}

function handleLap(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;

    const now=Date.now();
    
    const lap={
        id: now,
        startTime: now,
        duration: now-stopwatch.laps[stopwatch.laps.length-1].startTime
    }

    stopwatch.laps.push(lap);

    saveStopwatches();
    renderAll();
}

function handleDelete(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;

    stopwatches=stopwatches.filter((t)=>t.id!==id);
    saveStopwatches();
    renderAll();
}

function updateCardUI(stopwatch)
{
    const cardEl=document.querySelector(`.stopwatch-card[data-id="${stopwatch.id}"]`);
    if(!cardEl)return;

    const now=Date.now();

    if(stopwatch.status!=="idle")
    {
        const textEl=cardEl.querySelector(".stopwatch-text");
        if(textEl)
        {
            textEl.textContent=formatTime(now-stopwatch.laps[0].startTime);
            textEl.classList.toggle("is-running",stopwatch.status==="running")
        }
    
        const textSubEl=cardEl.querySelector(".stopwatch-text-sub");
        if(textSubEl)
        {
            textSubEl.textContent=formatTime(now-stopwatch.laps[stopwatch.laps.length-1].startTime);
        }
    }
    else
    {
        const textEl=cardEl.querySelector(".stopwatch-text");
        if(textEl)
        {
            textEl.textContent=formatTime(0);
        }
    
        const textSubEl=cardEl.querySelector(".stopwatch-text-sub");
        if(textSubEl)
        {
            textSubEl.textContent=formatTime(0);
        }
    }


    updateCardLapGrid(cardEl,stopwatch.laps);
    updateCardBtns(cardEl,stopwatch.status);
}

function updateCardLapGrid(cardEl,laps)
{
    const LapGrid=cardEl.querySelector(".stopwatch-lap-container");

    if(laps.length>1)
    {
        LapGrid.innerHTML=`<div class="stopwatch-lap-header">i</div>
                            <div class="stopwatch-lap-header">lap</div>
                            <div class="stopwatch-lap-header">total</div>`;

        let toBeAdded="";

        for(let i=1;i<laps.length;i++)
        {
            let totalMS=0;
            laps.forEach((aLap)=>
            {
                totalMS+=aLap.duration;
            })
            
            toBeAdded+=`<div class="stopwatch-lap-data">${String(i).padStart(2,"0")}</div>`;
            toBeAdded+=`<div class="stopwatch-lap-data">${formatTime(laps[i].duration)}</div>`;
            toBeAdded+=`<div class="stopwatch-lap-data">${formatTime(totalMS)}</div>`;
        }

        LapGrid.insertAdjacentHTML('beforeend',toBeAdded);
    }

}

function updateCardBtns(cardEl,status)
{
    const playBtn=cardEl.querySelector(".start");
    const pauseBtn=cardEl.querySelector(".pause");
    const replayBtn=cardEl.querySelector(".replay");
    const lapBtn=cardEl.querySelector(".lap")

    /*
            play    pause   replay  lap     
    idle    1                               
    running         1       1       1       
    paused  1               1       1       
    > 1=show                        
    */

    playBtn.classList.toggle("is-hidden", status==="running");
    pauseBtn.classList.toggle("is-hidden",status!=="running");
    replayBtn.classList.toggle("is-hidden",status==="idle");
    lapBtn.classList.toggle("is-hidden",status==="idle");
}

function renderAll()
{
    const container=document.getElementById("stopwatch-container");
    const listContainer=document.getElementById("stopwatch-list-container");

    if(container)container.innerHTML="";
    if(listContainer)listContainer.innerHTML="";

    stopwatches.forEach((stopwatch)=>
    {
        renderListedStopwatch(stopwatch);
        renderStopwatchCard(stopwatch);
    });
}

function renderListedStopwatch(stopwatch)
{
    const listContainer=document.getElementById("stopwatch-list-container");
    const template=document.getElementById("listed-stopwatch-template");
    if(!listContainer||!template)return;
    console.log(`listed stopwatch container: ${listContainer}`);
    console.log(`listed stopwatch template: ${template}`);

    const clone=template.content.cloneNode(true);
    const itemEl=clone.querySelector(".listed-stopwatch");
    itemEl.dataset.id=stopwatch.id;

    const deleteBtn=itemEl.querySelector(".delete");
    deleteBtn?.addEventListener("click",()=>handleDelete(stopwatch.id));

    const sortUpBtn=itemEl.querySelector(".sort-up");
    const sortDownBtn=itemEl.querySelector(".sort-down");
    sortUpBtn?.addEventListener("click",()=>handleMoveStopwatch(stopwatch.id,-1));
    sortDownBtn?.addEventListener("click",()=>handleMoveStopwatch(stopwatch.id,+1));

    listContainer.appendChild(clone);
}

function renderStopwatchCard(stopwatch)
{
    const container=document.getElementById("stopwatch-container");
    const template=document.getElementById("stopwatch-card-template");
    if(!container||!template)return;
    console.log(`stopwatch card container: ${container}`);
    console.log(`stopwatch card template: ${template}`);

    const clone=template.content.cloneNode(true);
    const cardEl=clone.querySelector(".stopwatch-card");

    cardEl.dataset.id=stopwatch.id;

    const playBtn=cardEl.querySelector(".start");
    const pauseBtn=cardEl.querySelector(".pause");
    const replayBtn=cardEl.querySelector(".replay");
    const lapBtn=cardEl.querySelector(".lap");

    playBtn?.addEventListener("click",()=>handleStart(stopwatch.id));
    pauseBtn?.addEventListener("click",()=>handlePause(stopwatch.id));
    replayBtn?.addEventListener("click",()=>handleReset(stopwatch.id));
    lapBtn?.addEventListener("click",()=>handleLap(stopwatch.id));

    container.appendChild(clone);

    updateCardUI(stopwatch);
}

function handleMoveStopwatch(id,direction)
{
    const index=stopwatches.findIndex((t)=>t.id===id);
    if(index===-1)return;

    const targetIndex=index+direction;

    if(targetIndex<0||targetIndex>=stopwatches.length)return;

    const temp=stopwatches[index];
    stopwatches[index]=stopwatches[targetIndex];
    stopwatches[targetIndex]=temp;

    saveStopwatches();
    renderAll();
}

let intervalId=null;

function startGlobalTick()
{
    if(intervalId)clearInterval(intervalId);

    intervalId=setInterval(()=>
    {
        const now=Date.now();
        let hasChanges=false;

        stopwatches.forEach((stopwatch)=>
        {
            if(stopwatch.status==="running")
            {
                hasChanges=true;

                // console.log(stopwatch);
                updateCardUI(stopwatch);
            }
        });

        if(hasChanges)
        {
            saveStopwatches();
        }
    },1);
}