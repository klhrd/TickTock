document.addEventListener("DOMContentLoaded",()=>
{
    initSidebarToggles();
    startProgressLoop();
});

function initSidebarToggles()
{
    const checkboxes=document.querySelectorAll('.progress-toggle');
    const activeUnits=getSavedUnits();

    checkboxes.forEach(checkbox=>
    {
        const unit=checkbox.value;
        const isChecked=activeUnits.includes(unit);

        checkbox.checked=isChecked;
        toggleCardVisibility(unit,isChecked);

        checkbox.addEventListener('change',()=>
        {
            const currentActive=Array.from(checkboxes)
                .filter(cb=>cb.checked)
                .map(cb=>cb.value);
            toggleCardVisibility(unit,checkbox.checked);
            saveUnitsState(currentActive);
        });
    });
}

function toggleCardVisibility(unit,isVisible)
{
    const card=document.querySelector(`.progress-card[data-unit="${unit}"]`);
    if(!card)return;

    if(isVisible)
    {
        card.classList.remove('hidden');
    }
    else
    {
        card.classList.add('hidden');
    }
}

function startProgressLoop()
{
    function loop()
    {
        const timeData=calculateTimeprogress();
        updateTicksUI(timeData);
        updateProgressCardUI(timeData);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function calculateTimeprogress()
{
    const now=new Date();

    // year
    const startOfYear=new Date(now.getFullYear(),0,1);
    const endOfYear=new Date(now.getFullYear()+1,0,1);
    const yearPct=((now-startOfYear)/(endOfYear-startOfYear))*100;
    
    // month
    const startOfMonth=new Date(now.getFullYear(),now.getMonth(),1);
    const endOfMonth=new Date(now.getFullYear(),now.getMonth()+1,1);
    const monthPct=((now-startOfMonth)/(endOfMonth-startOfMonth))*100;
    const totalDaysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    const currentDayVal=(now.getDate()-1+(now-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000).toFixed(1);

    // day
    const startOfDay=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const dayPct=((now-startOfDay)/86400000)*100;
    const currentHourVal=(now.getHours()+now.getMinutes()/60).toFixed(1);

    // hour
    const minutes=now.getMinutes();
    const seconds=now.getSeconds();
    const ms=now.getMilliseconds();
    const hourPct=((minutes*60+seconds+ms/1000)/3600)*100;
    const currentMinuteVal=(minutes+seconds/60).toFixed(1);

    // minute
    const minutePct=((seconds+ms/1000)/60)*100;
    const currentSecondVal=(seconds+ms/1000).toFixed(1);

    // second
    const secondPct=(ms/1000)*100;
    const currentMsVal=ms;

    return{
        totalDaysInMonth,
        units: 
        {
            year:{pct:yearPct,tag:`${yearPct.toFixed(1)}%`},
            month:{pct:monthPct,tag:`${currentDayVal}d`},
            day:{pct:dayPct,tag:`${currentHourVal}h`},
            hour:{pct:hourPct,tag:`${currentMinuteVal}m`},
            minute:{pct:minutePct,tag:`${currentSecondVal}s`},
            second:{pct:secondPct,tag:`${currentMsVal}ms`}            
        }
    };
}

function updateTicksUI(timeData)
{
    const ticksYear=document.getElementById('ticks-year');
    if(ticksYear&&!ticksYear.hasChildNodes())
    {
        ticksYear.innerHTML=`<span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span>`
    }

    const totalDays=timeData.totalDaysInMonth;
    const q1=(totalDays*0.25).toFixed(0);
    const q2=(totalDays*0.50).toFixed(0);
    const q3=(totalDays*0.75).toFixed(0);

    const ticksMonth=document.getElementById('ticks-month');
    if(ticksMonth)
    {
        ticksMonth.innerHTML=`<span>0</span><span>${q1}</span><span>${q2}</span><span>${q3}</span><span>${totalDays}d</span>`;
    }
}

function updateProgressCardUI(timeData)
{
    const unitsData=timeData.units;

    Object.keys(unitsData).forEach(unit=>
    {
        const rawPct=unitsData[unit].pct;
        const pct=Math.min(Math.max(rawPct,0),100);
        const tagText=unitsData[unit].tag;

        updateSingleCardUI(unit,pct,tagText);
    });
}

function updateSingleCardUI(unit,pct,tagText)
{
    const pctEl=document.getElementById(`pct-${unit}`);
    const barEl=document.getElementById(`bar-${unit}`);
    const thumbEl=document.getElementById(`thumb-${unit}`);
    const tagEl=document.getElementById(`tag-${unit}`);

    if(pctEl)pctEl.textContent=pct.toFixed(1)+'%';
    if(barEl)barEl.style.width=pct+'%';
    if(thumbEl)thumbEl.style.left=pct+'%';
    if(tagEl)
    {
        tagEl.style.left=pct+'%';
        tagEl.textContent=tagText;
    }
}

const ALL_UNITS=['year','month','day','hour','minute','second'];

function getSavedUnits()
{
    const hash =window.location.hash.replace('#','').trim();
    if(hash)
    {
        return hash.split(',').filter(u=>ALL_UNITS.includes(u));
    }

    const saved=localStorage.getItem('time_progress_units');
    if(saved)
    {
        try
        {
            return JSON.parse(saved);
        }
        catch(e)
        {
            console.error('Failed to parse saved units', e);
        }
    }

    return ALL_UNITS;
}

function saveUnitsState(activeUnits)
{
    localStorage.setItem('time_progress_units',JSON.stringify(activeUnits));

    const hashValue=activeUnits.length>0?`#${activeUnits.join(',')}`:`#`;
    history.replaceState(null,'',hashValue||window.location.pathname);
}

