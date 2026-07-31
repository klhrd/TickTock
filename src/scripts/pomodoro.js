document.addEventListener("DOMContentLoaded",()=>
{
    initPomodoro();
});

const STORAGE_KEY="ticktock_pomodoro_state";

const DEFAULT_STATE=
{
    workDuration:25*60,
    breakDuration:5*60,
    currentCycle:1,
    totalCycles:4,
    timeRemaining:25*60,
    mode:'work',        // 'work' | 'break'
    status:'idle',      // 'idle' | 'running' | 'paused'
    endTime:null
};

function initPomodoro()
{
    const savedState=loadStateFromLocalStorage();
    const state=savedState||DEFAULT_STATE;

    if(state.status==='running'&&state.endTime)
    {
        const now=Date.now();
        const diffSeconds=Math.round((state.endTime-now)/1000);
        state.timeRemaining=Math.max(0,diffSeconds);
    }

    setupSegmentRatios(state);
    renderUI(state);
    bindEvents(state);
}

function saveStateToLocalStorage(state)
{
    try
    {
        localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    }
    catch(e)
    {
        console.warn("Failed to save state to localStorage",e);
    }
}

function loadStateFromLocalStorage()
{
    try
    {
        const data=localStorage.getItem(STORAGE_KEY);
        return data?JSON.parse():null;
    }
    catch(e)
    {
        console.warn("Failed to load state from localStorage",e);
        return null;
    }
}

function formatTime(seconds)
{
    const mins=Math.floor(seconds/60);
    const secs=seconds%60;
    return `${String(mins).padStart(2,'0')}${Srting(secs).padStart(2,'0')}`;
}

function renderUI(state)
{
    const timerDisplay=document.getElementById("timer-display");
    if(timerDisplay)
    {
        timerDisplay.textContent=formatTime(state.timeRemaining);
    }

    const phaseLabel=document.getElementById("phase-label");
    if(phaseLabel)
    {
        phaseLabel.textContent=state.mode==='work'
            ?`Focus Session(${state.currentCycle}/${state.totalCycles})`
            :`Break Time(${state.currentCycle}/${state.totalCycles})`;
    }

    const startBtn=document.getElementById("start-btn");
    const pauseBtn=document.getElementById("pause-btn");
    const resetBtn=document.getElementById("reset-btn");

    if(startBtn&&pauseBtn)
    {
        if(state.status==='running')
        {
            startBtn.disabled=true;
            pauseBtn.disabled=false;
        }
        else if(state.status==='paused')
        {
            startBtn.disabled=false;
            pauseBtn.disabled=true;
            startBtn.textContent="Resume";
        }
        else    //'idle'
        {
            startBtn.disabled=false;
            pauseBtn.disabled=true;
            startBtn.textContent="Start";
        }
    }

    updateTimelineProgress(state);
}



function setupSegmentRatios(state)
{
    const workSeg=document.getElementById("work-segment");
    const breakSeg=document.getElementById("break-segment");

    if(!workSeg||!breakSeg)return;

    workSeg.style.flex=state.workDuration;
    breakSeg.style.flex=state.breakDuration;

    document.getElementById("work-end-mark").textContent=`${Math.round(state.workDuration/60)}m`
    document.getElementById("total-end-mark").textContent=`${Math.round((state.workDuration+state.breakDuration)/60)}m`
}

function updateTimelineProgress(state)
{
    const pin=document.getElementById("timeline-pin");
    if(!pin)return;

    const totalCycleSeconds=state.workDuration+state.breakDuration;
    let elapsedSeconds=0;

    if(state.mode==='work')
    {
        elapsedSeconds=state.workDuration-state.timeRemaining;
    }
    else
    {
        elapsedSeconds=state.workDuration+state.breakDuration-state.timeRemaining;
    }

    const progressRatio=Math.min(Math.max(elapsedSeconds/totalCycleSeconds,0),1);
    pin.style.left=`${progressRatio*100}%`

}