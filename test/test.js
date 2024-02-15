 
async function run() {
    const response = await fetch('http://192.168.68.60/api', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'status' })
    });

    const data = await response.json();

    console.log(response);
    console.log(data);
    
    document.getElementsByTagName("pre")[0].append(JSON.stringify(
        data['msg'], null, 2 /* spacing level */)) 
    
    
}

window.onload = run;
