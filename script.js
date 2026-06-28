// default
let targetString="2027-01-01";
let eventTitle="目標日";
loadInitialState();

let targetDate;
let timerId;

function loadInitialState()
{
    const hash=decodeURIComponent(window.location.hash.substring(1));
    
    // 1. url #tag
    if(hash&& /^\d{4}-\d{2}-\d{2}(&.*)?$/.test(hash))
    {
        const parts=hash.split('&');
        targetString=parts[0];
        eventTitle=parts[1]||localStorage.getItem("eventTitle")||"目標";
        return hash;
    }

    // 2. local storage
    const localDate=localStorage.getItem("targetDate");
    const localTitle=localStorage.getItem("eventTitle");
    if(localDate) targetString=localDate;
    if(localTitle) eventTitle=localTitle;

}

function updateTimer()
{
    const nowTime=new Date().getTime();
    const timeLeft=Math.floor((targetDate-nowTime)/1000);
    
    if (timeLeft<=0)
    {
        clearInterval(timerId);
        document.getElementById("years").innerText=0;
        document.getElementById("months").innerText=0;
        document.getElementById("days").innerText=0;
        document.getElementById("hours").innerText=0;
        document.getElementById("minutes").innerText=0;
        document.getElementById("seconds").innerText=0;
        return;

    }
    
    const target=new Date(targetString+"T00:00:00+08:00");
    const now=new Date();
    
    let y=target.getFullYear()-now.getFullYear();
    let mo=target.getMonth()-now.getMonth();
    let d=target.getDate()-now.getDate();
    let h=target.getHours()-now.getHours();
    let m=target.getMinutes()-now.getMinutes();
    let s=target.getSeconds()-now.getSeconds();

    if(s<0){s+=60;m--;}
    if(m<0){m+=60;h--;}
    if(h<0){h+=24;d--} 
    if(d<0)
    {
        // 將日期設為本月第 0 天，就能拿到上個月的最後一天（即總天數）
        const daysInPrevMonth=new Date(now.getFullYear(),now.getMonth(),0).getDate();
        d+=daysInPrevMonth;
        mo--;
    }
    if(mo<0){mo+=12;y--}

    document.getElementById("years").innerText=y;
    document.getElementById("months").innerText=mo;
    document.getElementById("days").innerText=d;
    document.getElementById("hours").innerText=h;
    document.getElementById("minutes").innerText=m;
    document.getElementById("seconds").innerText=s;

    let hasValue=false;

    if(y>0)
    {
        hasValue=true;
        document.getElementById("years").parentElement.style.display="";
    }
    else
    {
        document.getElementById("years").parentElement.style.display="none";
    }

    if(mo>0||hasValue)
    {
        hasValue=true;
        document.getElementById("months").parentElement.style.display="";
    }
    else
    {
        document.getElementById("months").parentElement.style.display="none";
    }

    if(d>0||hasValue)
    {
        hasValue=true;
        document.getElementById("days").parentElement.style.display="";
    }
    else
    {
        document.getElementById("days").parentElement.style.display="none";
    }

    if(h>0||hasValue)
    {
        hasValue=true;
        document.getElementById("hours").parentElement.style.display="";
    }
    else
    {
        document.getElementById("hours").parentElement.style.display="none";
    }
    
    if(m>0||hasValue)
    {
        hasValue=true;
        document.getElementById("minutes").parentElement.style.display="";
    }
    else
    {
        document.getElementById("minutes").parentElement.style.display="none";
    }

    document.getElementById("seconds").parentElement.style.display="";
}

function initTimer(newDateString, newTitleString)
{
    targetString=newDateString;
    if(newTitleString!==undefined) eventTitle=newTitleString;
    
    targetDate=new Date(targetString+"T00:00:00+08:00").getTime();
    
    // 更新畫面
    document.getElementById("target-label").innerText=targetString;
    document.getElementById("date-input").value=targetString;
    document.getElementById("event-label").innerText=eventTitle;
    document.getElementById("title-input").value=eventTitle;

    clearInterval(timerId);
    timerId=setInterval(updateTimer,100);
    updateTimer();
}

// 事件監聽
const sidebar=document.getElementById("sidebar");
const menuBtn=document.querySelector(".menu-btn");
const closeMenuBtn=document.getElementById("close-menu-btn");
const dateInput=document.getElementById("date-input");
const overLay=document.getElementById("overlay");
const titleInput=document.getElementById("title-input");

initTimer(targetString, eventTitle);

menuBtn.addEventListener("click",()=>
{
    sidebar.classList.add("open");
    overLay.classList.add("show");
});

closeMenuBtn.addEventListener("click",()=>
{
    sidebar.classList.remove("open");
    overLay.classList.remove("show");
});

titleInput.addEventListener("change",(e)=>
{
    const newTitle=e.target.value.trim();
    
    if(newTitle==="")newTitle="目標";

    localStorage.setItem("eventTitle",newTitle);
    window.location.hash=targetString+"&"+encodeURIComponent(newTitle);

    initTimer(targetString, newTitle);
})

dateInput.addEventListener("change",(e)=>
{
    const newDate=e.target.value;
    // 防呆：沒選就跳出
    if(!newDate)return;

    localStorage.setItem("targetDate",newDate);
    window.location.hash=newDate+"&"+encodeURIComponent(eventTitle);

    initTimer(newDate, eventTitle);
})

window.addEventListener("hashchange",()=>
{
    const newHash=encodeURIComponent(window.location.hash.substring(1));
    if(newHash&&/^\d{4}-\d{2}-\d{2}(&.*)?$/.test(newHash))
    {
        const parts=newHash.split('&');
        initTimer(parts[0],parts[1]||"目標日");
    }
})

overLay.addEventListener("click",()=>
{
    sidebar.classList.remove("open");
    overLay.classList.remove("show");
});
