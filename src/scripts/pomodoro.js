document.addEventListener("DOMContentLoaded",()=>
{
    initPomodoro();
});

const DEFAULT_STATE=
{
    workDuration:25*60,
    breakDuration:5*60,
    currentCycle:1,
    totalCycles:4,
    timeRemaining:25*60,
    // 'work' | 'break'
    mode:'work',
    // 'idle' | 'running' | 'paused'
    status:'idle',
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
    const progressBar=document.getElementById("timeline-progress");
    const total=state.workDuration;
    const current=state.timeRemaining;

    const percentage=((total-current)/total)*100;
    progressBar.style.width=`${percentage}%`

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