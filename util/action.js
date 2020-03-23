let listAction = [];
let actionEnCour = false;

let manageAction = (action) => {
    if(!Array.isArray(action)){
        listAction.push(action);
    }
    else{
        action.forEach(element => {
            listAction.push(action);
        });
    }

    if(!actionEnCour){
        launchAction();
    }
}

let launchAction = async () => {
    let action = null;

    if(listAction.length > 0){
        action = listAction.shift();

        actionEnCour = true;
        await action();
        launchAction();
    }
    else{
        actionEnCour = false;
    }
}

module.exports = manageAction;;