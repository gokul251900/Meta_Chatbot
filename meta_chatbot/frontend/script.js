const API_URL="http://127.0.0.1:8000";
let conversationHistory=[];
const chat=document.getElementById("chat");
const messageInput=document.getElementById("message");
const sendButton=document.getElementById("sendButton");

async function sendMessage(){
  const message=messageInput.value.trim();
  if(!message)return;
  removeWelcome();
  addMessage("user",message);
  messageInput.value="";
  autoResize();
  sendButton.disabled=true;
  const typingId=showTyping();
  try{
    const response=await fetch(`${API_URL}/api/chat`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message,history:conversationHistory})
    });
    const data=await response.json();
    removeTyping(typingId);
    if(!response.ok)throw new Error(data.detail||"Server error");
    addMessage("assistant",data.response);
    conversationHistory.push({role:"user",content:message});
    conversationHistory.push({role:"assistant",content:data.response});
  }catch(error){
    removeTyping(typingId);
    addMessage("assistant","❌ Error: "+error.message);
    console.error(error);
  }finally{
    sendButton.disabled=false;
    messageInput.focus();
  }
}

function addMessage(role,text){
  const wrapper=document.createElement("div");
  wrapper.className="message";
  const avatar=document.createElement("div");
  avatar.className="avatar "+(role==="user"?"user-avatar":"ai-avatar");
  avatar.textContent=role==="user"?"U":"G";
  const content=document.createElement("div");
  content.className="message-content";
  if(role==="user"){
    const t=document.createElement("div");
    t.className="user-text";
    t.textContent=text;
    content.appendChild(t);
  }else{
    content.innerHTML=formatAIResponse(text);
  }
  wrapper.appendChild(avatar);
  wrapper.appendChild(content);
  chat.appendChild(wrapper);
  scrollToBottom();
}

function formatAIResponse(text){
  const codeRegex=/```(\w*)\n?([\s\S]*?)```/g;
  let html="",lastIndex=0,match;
  while((match=codeRegex.exec(text))!==null){
    html+=escapeHTML(text.substring(lastIndex,match.index)).replace(/\n/g,"<br>");
    const language=match[1]||"code";
    const code=match[2].trim();
    const codeId="code-"+Date.now()+"-"+Math.random().toString(36).substring(2);
    html+=`<div class="code-block"><div class="code-header"><span>${escapeHTML(language)}</span><button class="copy-btn" onclick="copyCode('${codeId}')">Copy</button></div><pre><code id="${codeId}">${escapeHTML(code)}</code></pre></div>`;
    lastIndex=codeRegex.lastIndex;
  }
  html+=escapeHTML(text.substring(lastIndex)).replace(/\n/g,"<br>");
  return html;
}

function escapeHTML(text){
  const div=document.createElement("div");
  div.textContent=text;
  return div.innerHTML;
}

async function copyCode(id){
  const code=document.getElementById(id);
  if(!code)return;
  await navigator.clipboard.writeText(code.textContent);
  const button=code.closest(".code-block").querySelector(".copy-btn");
  const oldText=button.textContent;
  button.textContent="Copied!";
  setTimeout(()=>button.textContent=oldText,1500);
}

function showTyping(){
  const id="typing-"+Date.now();
  const wrapper=document.createElement("div");
  wrapper.className="message";
  wrapper.id=id;
  wrapper.innerHTML=`<div class="avatar ai-avatar">G</div><div class="message-content"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(wrapper);
  scrollToBottom();
  return id;
}

function removeTyping(id){
  const element=document.getElementById(id);
  if(element)element.remove();
}

function removeWelcome(){
  const welcome=document.getElementById("welcome");
  if(welcome)welcome.remove();
}

function usePrompt(prompt){
  messageInput.value=prompt;
  autoResize();
  messageInput.focus();
}

function newChat(){
  conversationHistory=[];
  chat.innerHTML=`<div id="welcome" class="welcome"><div class="welcome-icon">G</div><h2>What are you building today?</h2><p>Ask me about programming, debugging, AI, databases, software development and more.</p></div>`;
  messageInput.value="";
  autoResize();
}

function handleKey(event){
  if(event.key==="Enter"&&!event.shiftKey){
    event.preventDefault();
    sendMessage();
  }
}

messageInput.addEventListener("input",autoResize);
function autoResize(){
  messageInput.style.height="auto";
  messageInput.style.height=Math.min(messageInput.scrollHeight,160)+"px";
}
function scrollToBottom(){
  chat.scrollTop=chat.scrollHeight;
}
