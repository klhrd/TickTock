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
            endTime: Date.now(),      // 該 Lap 的時刻結束 ( lap 觸發時刻 )
            duration: 0
        }
    ]
    pauseStartTime
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

function formatTimeIntoHTML(ms)
{
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    const f=ms%1000;

    const timeStr=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(f).padStart(3,"0")}`;

    return timeStr.split('').map(char=>
    {
        if(char===":"||char===".")
        {
            return `<span class="time-char" style="display: inline-block !important; width: 0.35em !important; text-align: center; ">${char}</span>`;
        }
        else if(char==="0")
        {
            return `<span class="time-char" style="display: inline-block !important; width: 0.7em !important; text-align: center; transform: scaleX(0.8); transform-origin: center;">${char}</span>`;        
        }
        else
        {
            return `<span class="time-char" style="display: inline-block !important; width: 0.7em !important; text-align: center; ">${char}</span>`;        
        }
    }).join('');
}

function formatTimeIntoText(ms)
{
    const h=Math.floor(ms/3600000);
    const m=Math.floor((ms%3600000)/60000);
    const s=Math.floor((ms%60000)/1000);
    const f=ms%1000;

    const timeStr=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(f).padStart(3,"0")}`;

    return timeStr;
}

function formatLapsOutput(id,now)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;

    let output=
`Total: 
${formatTimeIntoText(now-stopwatch?.laps[0]?.endTime||0)}
`;

    const laps=stopwatch.laps;
    if(laps.length>1)
    {
        output+="\n";

        for(let i=1;i<laps.length;i++)
        {
            let totalMS=0;
            for(let j=0;j<=i;j++)
            {
                totalMS+=laps[j].duration;
            }
            
            output+=`${String(i).padStart(2,"0")}`+"\t";
            output+=`${formatTimeIntoText(laps[i].duration)}`+"\t";
            output+=`${formatTimeIntoText(totalMS)}`+"\n";
        }
    }

    return output;    
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
            endTime: now,
            duration: 0
        }
        stopwatch.laps.push(lap);

        stopwatch.status="running";
    }
    else if(stopwatch.status==="paused")
    {
        const pauseDuration=Date.now()-stopwatch.pauseStartTime;

        stopwatch.laps.forEach((lap)=>
        {
            lap.endTime+=pauseDuration;
        })

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
    stopwatch.pauseStartTime=Date.now();

    saveStopwatches();
    updateCardUI(stopwatch);
}

function handleReset(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;
    
    stopwatch.status="idle";
    stopwatch.endTime=null;
    stopwatch.laps=[];
    
    saveStopwatches();
    updateCardUI(stopwatch);
    renderAll();
}

function handleLap(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;

    const now=stopwatch.status==="running"?Date.now():stopwatch.pauseStartTime;
    
    const lap={
        id: now,
        endTime: now,
        duration: now-stopwatch.laps[stopwatch.laps.length-1].endTime
    }

    stopwatch.laps.push(lap);

    saveStopwatches();
    renderAll();
}

async function handleCopy(textToCopy)
{
    let success=false;

    try
    {
        await navigator.clipboard.writeText(textToCopy);

        success=true;
        console.log("succeeded to copy: ",textToCopy);
    }
    catch(err)
    {
        console.error("failed to copy: ",textToCopy);
        alert("failed to copy")
    }

    return success;
}

function handleDelete(id)
{
    const stopwatch=stopwatches.find((t)=>t.id===id);
    if (!stopwatch)return;

    stopwatches=stopwatches.filter((t)=>t.id!==id);
    saveStopwatches();
    renderAll();
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
    // console.log(`listed stopwatch container: ${listContainer}`);
    // console.log(`listed stopwatch template: ${template}`);

    const clone=template.content.cloneNode(true);
    const itemEl=clone.querySelector(".listed-stopwatch");
    itemEl.dataset.id=stopwatch.id;

    const now=stopwatch.status==="running"?Date.now():stopwatch.pauseStartTime;
    const textEl=itemEl.querySelector(".listed-stopwatch-demo");
    textEl.innerHTML=formatTimeIntoHTML((now-stopwatch.laps?.[0]?.endTime)||0);
    textEl.classList.toggle("is-running",stopwatch.status==="running")
    
    const deleteBtn=itemEl.querySelector(".delete");
    deleteBtn?.addEventListener("click",()=>handleDelete(stopwatch.id));

    const sortUpBtn=itemEl.querySelector(".sort-up");
    const sortDownBtn=itemEl.querySelector(".sort-down");
    sortUpBtn?.addEventListener("click",()=>handleMoveStopwatch(stopwatch.id,-1));
    sortDownBtn?.addEventListener("click",()=>handleMoveStopwatch(stopwatch.id,+1));

    listContainer.appendChild(clone);
}

function updateListedStopwatch(stopwatch)
{
    const cardEl=document.querySelector(`.listed-stopwatch[data-id="${stopwatch.id}"]`);
    if(!cardEl)
    {
        renderListedStopwatch(stopwatch);
        return;
    }

    const now=stopwatch.status==="running"?Date.now():stopwatch.pauseStartTime;
    
    const textEl=cardEl.querySelector(".listed-stopwatch-demo");
    textEl.innerHTML=formatTimeIntoHTML(now-stopwatch?.laps[0]?.endTime||0);
    textEl.classList.toggle("is-running",stopwatch.status==="running")
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
    const copyBtn=cardEl.querySelector(".copy");

    playBtn?.addEventListener("click",()=>handleStart(stopwatch.id));
    pauseBtn?.addEventListener("click",()=>handlePause(stopwatch.id));
    replayBtn?.addEventListener("click",()=>handleReset(stopwatch.id));
    lapBtn?.addEventListener("click",()=>handleLap(stopwatch.id));
    copyBtn?.addEventListener("click",()=>
    {
        const copyData=formatLapsOutput(stopwatch.id,Date.now());

        const icon=copyBtn.querySelector(".material-symbols-outlined");        
        icon.textContent=handleCopy(copyData)?"check":"error";
        icon.style.color="var(--accent-color)";
        setTimeout(()=>
        {
            icon.textContent="content_copy";
            icon.style.color="var(--text-secondary)";
        }, 2000);
    });

    container.appendChild(clone);

    updateCardUI(stopwatch);
}

function updateCardUI(stopwatch)
{
    const cardEl=document.querySelector(`.stopwatch-card[data-id="${stopwatch.id}"]`);
    if(!cardEl)return;

    const now=stopwatch.status==="running"?Date.now():stopwatch.pauseStartTime;

    if(stopwatch.status!=="idle")
    {
        const textEl=cardEl.querySelector(".stopwatch-text");
        if(textEl)
        {
            textEl.innerHTML=formatTimeIntoHTML(now-stopwatch?.laps[0]?.endTime||0);
            textEl.classList.toggle("is-running",stopwatch.status==="running");
        }
    
        const textSubEl=cardEl.querySelector(".stopwatch-text-sub");
        if(textSubEl)
        {
            textSubEl.innerHTML=formatTimeIntoHTML(now-stopwatch.laps[stopwatch.laps.length-1].endTime);
            textSubEl.classList.toggle("is-running",stopwatch.status==="running");
        }
    }
    else
    {
        const textEl=cardEl.querySelector(".stopwatch-text");
        if(textEl)
        {
            textEl.innerHTML=formatTimeIntoHTML(0);
            textEl.classList.toggle("is-running",stopwatch.status==="running")
        }
    
        const textSubEl=cardEl.querySelector(".stopwatch-text-sub");
        if(textSubEl)
        {
            textSubEl.innerHTML=formatTimeIntoHTML(0);
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
            for(let j=0;j<=i;j++)
            {
                totalMS+=laps[j].duration;
            }
            
            toBeAdded+=`<div class="stopwatch-lap-data">${String(i).padStart(2,"0")}</div>`;
            toBeAdded+=`<div class="stopwatch-lap-data">${formatTimeIntoHTML(laps[i].duration)}</div>`;
            toBeAdded+=`<div class="stopwatch-lap-data">${formatTimeIntoHTML(totalMS)}</div>`;
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
    running         1               1       
    paused  1               1               
    > 1=show                        
    */

    playBtn.classList.toggle("is-hidden", status==="running");
    pauseBtn.classList.toggle("is-hidden",status!=="running");
    replayBtn.classList.toggle("is-hidden",status!=="paused");
    lapBtn.classList.toggle("is-hidden",status!=="running");
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

        stopwatches.forEach((stopwatch)=>
        {
            if(stopwatch.status==="running")
            {
                // console.log(stopwatch);
                updateCardUI(stopwatch);
                updateListedStopwatch(stopwatch);
                saveStopwatches();
            }
        });
    },73);
}