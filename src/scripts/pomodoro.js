document.addEventListener("DOMContentLoaded",()=>
{
    initPomodoro();
    DEFAULT_STATE.timeRemaining=DEFAULT_STATE.workDuration;
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

        if(data==="undefined"||!data)return null;

        return JSON.parse();
    }
    catch(e)
    {
        console.warn("Failed to load state from localStorage",e);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

function formatTime(seconds)
{
    const mins=Math.floor(seconds/60);
    const secs=seconds%60;
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
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
    updateEstimatedTimeDisplay(state);
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

let timerInterval=null;

function startTimer(state)
{
    if(state.status==='running')return;

    if(timerInterval)
    {
        clearInterval(timerInterval);
        timerInterval=null;
    }

    state.status='running';
    state.endTime=Date.now()+state.timeRemaining*1000;
    saveStateToLocalStorage(state);
    renderUI(state);


    timerInterval=setInterval(()=>
    {
        const now=Date.now();
        const diffSeconds=Math.ceil((state.endTime-now)/1000);

        if(diffSeconds<=0)
        {
            state.timeRemaining=0;
            renderUI(state);

            clearInterval(timerInterval);
            timerInterval=null;

            handlePhaseEnd(state);
        }
        else
        {
            state.timeRemaining=diffSeconds;
            renderUI(state);
            saveStateToLocalStorage(state);
        }
    },1000);
}

function pauseTimer(state)
{
    if(state.status!=='running')return;

    if(timerInterval)
    {
        clearInterval(timerInterval);
        timerInterval=null;
    }

    state.status='paused'
    state.endTime=null;

    saveStateToLocalStorage(state);
    renderUI(state);
}

function resetTimer(state)
{
    if(timerInterval)
    {
        clearInterval(timerInterval);
        timerInterval=null;
    }

    state.status='idle'
    state.mode='work';
    state.currentCycle=1;
    state.timeRemaining=state.workDuration;
    state.endTime=null;

    saveStateToLocalStorage(state);
    renderUI(state);
}

function bindEvents(state)
{
    const startBtn=document.getElementById("start-btn");
    const pauseBtn=document.getElementById("pause-btn");
    const resetBtn=document.getElementById("reset-btn");
    const menuStartBtn=document.getElementById("menu-start-btn");
    const cyclesInput=document.getElementById("cycles-input");

    startBtn?.addEventListener("click",()=>startTimer(state));
    pauseBtn?.addEventListener("click",()=>pauseTimer(state));
    resetBtn?.addEventListener("click",()=>resetTimer(state));

    if(menuStartBtn)
    {
        menuStartBtn.addEventListener("click",()=>
        {
            if(state.status==='running')
            {
                pauseTimer(state);
            }
            else
            {
                startTimer(state);
            }
        });
    }

    if(cyclesInput)
    {
        cyclesInput.value=state.totalCycles;
        cyclesInput.addEventListener("change",(e)=>
        {
            const val=parseInt(e.target.value,10);
            if(!isNaN(val)&&val>=1&&val<=12)
            {
                state.totalCycles=val;
                saveStateToLocalStorage(state);
                renderUI(state);
            }
        });
    }
}

function handlePhaseEnd(state)
{
    playNotifSound();

    state.status='idle';

    if(state.mode==='work')
    {
        state.mode='break';
        state.timeRemaining=state.breakDuration;
        state.endTime=Date.now()+state.timeRemaining*1000;

        saveStateToLocalStorage(state);
        renderUI(state);

        startTimer(state);
    }
    else
    {
        if(state.currentCycle<state.totalCycles)
        {
            state.currentCycle+=1;
            state.mode='work';
            state.timeRemaining=state.workDuration;
            state.endTime=Date.now()+state.timeRemaining*1000;

            saveStateToLocalStorage(state);
            renderUI(state);

            startTimer(state);
        }
        else
        {
            alert("All pomodoro cycles completed.");
            resetTimer(state);
        }
    }
    saveStateToLocalStorage(state);
    renderUI(state);
}

function updateEstimatedTimeDisplay(state)
{
    const displayEl=document.getElementById("estimated-time-display");
    if(!displayEl)return;

    const totalSeconds=(state.workDuration+state.breakDuration)*state.totalCycles;

    const hours=Math.floor(totalSeconds/3600);
    const minutes=Math.floor((totalSeconds%3600)/60);

    if(hours>0)
    {
        displayEl.textContent=`${hours}h ${minutes}m`;
    }
    else
    {
        displayEl.textContent=`${minutes}m`;
    }
}

function playNotifSound()
{
    const notifAudio=new Audio("/public/sounds/notif.wav");

    notifAudio.volume=0.6;

    notifAudio.play().catch(err=>
    {
        console.warn("Audio play blocked by brower interation policy: ",err);
    });
}

