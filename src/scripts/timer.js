// src/scripts/timer.js

if (typeof window !== "undefined")
{
    window.addEventListener("DOMContentLoaded",()=>
    {
        loadTimers();
        initializeApp();
        renderAll();
        startGlobalTick();
    });
}

const STORAGE_KEY="ticktock_timer_state";
let timers=[];

const DEFAULT_STATE=
{
    
};

function initializeApp()
{
    const addBtn=document.querySelector(".timer-adding-action-btn button");
    console.log("add button element: ",addBtn);
    
    if(addBtn)
    {
        addBtn.addEventListener("click",()=>
        {
            console.log("add button clicked");
            handleAddTimer();
        });
    }

    setupArrowBtns();
}

function saveTimers()
{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(timers));
}

function loadTimers()
{
    const data=localStorage.getItem(STORAGE_KEY);
    timers=data?JSON.parse(data):[];
}

function formatTime(sec)
{
    const h=Math.floor(sec/3600);
    const m=Math.floor((sec%3600)/60);
    const s=sec%60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
}

function setupArrowBtns()
{
    const setupUnit=(upId,downId,inputId,max)=>
    {
        const up=document.getElementById(upId);
        const down=document.getElementById(downId);
        const input=document.getElementById(inputId);

        if(!up||!down||!input)return;

        up.addEventListener("click",()=>
        {
            let val=parseInt(input.value)||0;
            if(val<max)input.value=String(val+1).padStart(2,"0");
        });

        down.addEventListener("click",()=>
        {
            let val=parseInt(input.value)||0;
            if(val>0)input.value=String(val-1).padStart(2,"0");
        });
    }

    setupUnit("hour-number-up","hour-number-down","hour-number-input",99);
    setupUnit("minute-number-up","minute-number-down","minute-number-input",59);
    setupUnit("second-number-up","second-number-down","second-number-input",59);
}

function handleAddTimer()
{
    const h=parseInt(document.getElementById("hour-number-input").value)||0;
    const m=parseInt(document.getElementById("minute-number-input").value)||0;
    const s=parseInt(document.getElementById("second-number-input").value)||0;

    const totalSeconds=h*3600+m*60+s;
    console.log(`totalSecond: ${totalSeconds}`);
    if(totalSeconds<=0)return;

    const newTimer=
    {
        id: Date.now(),
        totalSeconds: totalSeconds,
        remainingSeconds: totalSeconds,     // 剩餘秒數(停止時以此為主)
        startTime: null,                    // 啟動時間(倒數時以此為主)
        endTime: null,
        status: "idle"                      // 'idle' | 'running' | 'paused' | 'ended'
    };

    timers.push(newTimer);
    saveTimers();
    renderAll();
}

function renderTimerCard(timerData)
{
    const container=document.getElementById("timer-container");
    const template=document.getElementById("timer-card-template");
    console.log(`timer card container: ${container}`);
    console.log(`timer card template: ${template}`);
    if(!container||!template)return;

    const clone=template.content.cloneNode(true);
    const cardEl=clone.querySelector(".timer-card");

    cardEl.dataset.id=timerData.id;

    const playBtn=cardEl.querySelector(".start");
    const pauseBtn=cardEl.querySelector(".pause");
    const replayBtn=cardEl.querySelector(".replay");

    playBtn.addEventListener("click",()=>handleStart(timerData.id));
    pauseBtn.addEventListener("click",()=>handlePause(timerData.id));
    replayBtn.addEventListener("click",()=>handleReset(timerData.id));

    container.appendChild(clone);

    updateCardUI(timerData);
}

function handleStart(id)
{
    const timer=timers.find((t)=>t.id===id);
    if(!timers)return;

    const now=Date.now();
    timer.status="running";
    timer.startTime=now;
    timer.endTime=now+timer.remainingSeconds*1000;

    console.log(timer);
    saveTimers();
    updateCardUI(timer);
}

function handlePause(id)
{
    const timer=timers.find((t)=>t.id===id);
    if(!timer)return;

    timer.status="paused";
    saveTimers();
    updateCardUI(timer);
}

function handleReset(id)
{
    const timer=timers.find((t)=>t.id===id);
    if (!timer)return;

    timer.status="idle";
    timer.remainingSeconds=timer.totalSeconds;
    timer.startTime=null;
    timer.endTime;

    saveTimers();
    updateCardUI(timer);
}

function updateCardBtns(cardEl,status)
{
    const playBtn=cardEl.querySelector(".start");
    const pauseBtn=cardEl.querySelector(".pause");
    const replayBtn=cardEl.querySelector(".replay");

    /*
            play    pause   replay  
    idle    1                       
    running         1       1       
    paused  1               1       
    ended                   1       
    > 1=show                        
    */

    playBtn.classList.toggle("is-hidden", status==="running"||status==="ended");
    pauseBtn.classList.toggle("is-hidden",status!=="running");
    replayBtn.classList.toggle("is-hidden",status==="idle");
}

function updateCardUI(timer)
{
    const cardEl=document.querySelector(`.timer-card[data-id="${timer.id}"]`);
    if(!cardEl)return;

    const textEl=cardEl.querySelector(".timer-text");
    if(textEl)
    {
        textEl.textContent=formatTime(timer.remainingSeconds);
    }

    const circle=cardEl.querySelector(".progress-ring__circle");
    if(circle)
    {
        const circumference=659.7;
        const progress=timer.remainingSeconds/timer.totalSeconds;
        const offset=circumference-progress*circumference;
        circle.style.strokeDashoffset=offset;
    }

    updateCardBtns(cardEl,timer.status);
}

function renderAll()
{
    const container=document.getElementById("timer-container");
    const listContainer=document.getElementById("timer-list-container");

    if(container)container.innerHTML="";
    if(listContainer)listContainer.innerHTML="";

    timers.forEach((timer)=>
    {
        renderListedTimer(timer);
        renderTimerCard(timer);
    });
}

function renderListedTimer(timerData)
{
    const listContainer=document.getElementById("timer-list-container");
    const template=document.getElementById("listed-timer-template");
    console.log(`listed timer container: ${listContainer}`);
    console.log(`listed timer template: ${template}`);
    if(!listContainer||!template)return;

    const clone=template.content.cloneNode(true);
    const itemEl=clone.querySelector(".listed-timer");
    itemEl.dataset.id=timerData.id;

    const inputs=itemEl.querySelectorAll("input");
    const h=Math.floor(timerData.totalSeconds/3600);
    const m=Math.floor((timerData.totalSeconds%3600)/60);
    const s=timerData.totalSeconds%60;
    
    inputs[0].value=String(h).padStart(2,"0");
    inputs[1].value=String(m).padStart(2,"0");
    inputs[2].value=String(s).padStart(2,"0");

    const deleteBtn=itemEl.querySelector(".delete");
    deleteBtn.addEventListener("click",()=>handleDelete(timerData.id));

    listContainer.appendChild(clone);
}

function handleDelete(id)
{
    timers=timers.filter((t)=>t.id!==id);
    saveTimers();
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

        timers.forEach((timer)=>
        {
            if(timer.status==="running")
            {
                hasChanges=true;

                const remaining=Math.max(0,Math.ceil((timer.endTime-now)/1000));

                timer.remainingSeconds=remaining;

                if(remaining<=0)
                {
                    timer.status="ended";
                    timer.remainingSeconds=0;
                }

                console.log(timer);
                updateCardUI(timer);
            }
        });

        if(hasChanges)
        {
            saveTimers();
        }
    },200);
}