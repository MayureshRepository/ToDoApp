console.log('Hello');
let tasks=[];
const countdata = document.getElementById('counter');
const typedText = document.getElementById('screenInput');
var taskList = document.getElementById('list');
var count =0 ;

function popAlert(message){
    alert(message);
}


function AddToDom(task){

    const list = document.createElement('div');

    list.innerHTML= `
    <div class="card">
   
   
    <input type="checkbox" id="${task.count}" ${task.done? 'checked' : ''}    class="custom-checkbox" >

    <label class="details" >
    ${task.data}

    <span    ><img src="delete.png"  class="delete"  id="${task.count}" alt="deleteIcon"></span>


    
       
    </label>
</div>


    `;

    taskList.append(list);
}


function renderList(){

   taskList.innerHTML='';
  

    for(let i=0;i<tasks.length;i++){
        AddToDom(tasks[i]);
    }

    countdata.innerHTML = tasks.length;

}

function markAsComplete(countId){
    const taskToggle = tasks.filter(function(task){
        return task.id === countId ;
    });

    if(taskToggle.length>0){
        var newToggle = taskToggle[0];

        newToggle.done= !newToggle.done;

        
            let flagToggle='false';
        
            if(newToggle.done){
                    flagToggle == 'true';
            }
            else{
                flagToggle == 'false';
        }

        renderList();
        
        return;
    }
    
   
}


function deleteToDo(countId){

    const counts = tasks.filter(function(task){
       return  task.count != countId ;
 
    });

    console.log(counts);

    tasks = counts ;
    renderList();

}

//for collecting data from Click  button
function saveData(){
    var inputdata = typedText.value;
    if(!inputdata){
         popAlert("Text feild Can't be Empty !!");
         return;
    }
    else{
        
        const task={
            count : count++ ,
            data :inputdata 
        }
        
        tasks.push(task);
        popAlert("Task Added !!");
        renderList();
        
    }

    typedText.value='';
    
}

function listenEvent(e){

    console.log(e.target ,"Listener");

    const targetBtn = e.target;

    if(targetBtn.className ==='delete'){
        const taskIds = targetBtn.id;
        deleteToDo(taskIds);
        popAlert("Deleted Task");
        return;
    }
    else if(targetBtn.className==="custom-checkbox"){
        const taskIds = targetBtn.id;
        markAsComplete(taskIds);
    }
    
}

document.addEventListener('click',listenEvent);
// for collecting data from Enter button

typedText.addEventListener('keyup',function dataCollect(e){
   if(e.key ==='Enter'){
    var data = e.target.value;
    if(!data){
         popAlert("Text feild Can't be Empty !!");
         return;
    }
    else{
        
        const task={
            count : count++ ,
            data,
            done:false
        }
        
        tasks.push(task);
        popAlert("Task Added !!");
        renderList();
        
    }

    e.target.value='';

   }


  

})





