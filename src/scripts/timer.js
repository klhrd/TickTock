// src/scripts/timer.js

if (typeof window !== "undefined")
{
    window.addEventListener("DOMContentLoaded",()=>
    {
        loadInitialState();
        initializeApp();
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
    if(addBtn)
    {
        addBtn.addEventListener("click",handleAddTimer);
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
        })

        down.addEventListener("click",()=>
        {
            let val=parseInt(input.value)||0;
            if(val>0)input.value=String(val-1).padStart(2,"0");
        })

        setupUnit("hour-number-up","hour-number-down","hour-number-input",99);
        setupUnit("minute-number-up","minute-number-down","minute-number-input",59);
        setupUnit("second-number-up","second-number-down","second-number-input",59);
    }
}

function handleAddTimer()
{
    const h=parseInt(document.getElementById("hour-number-input").value)||0;
    const m=parseInt(document.getElementById("minute-number-input").value)||0;
    const s=parseInt(document.getElementById("second-number-input").value)||0;

    const totalSeconds=h*3600+m*60+s;
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
    // renderAll();
}

function renderTimerCard(timerData)
{
    const container=document.getElementById("timer-container");
    const template=document.getElementById("timer-card-template");

    const clone=template.content.cloneNode(true);
    const cardEl=clone.querySelector(".timer-card");

    //...

    container.appendChild(clone)
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
