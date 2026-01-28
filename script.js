
document.addEventListener('DOMContentLoaded', () => {
  // --- UI Element Selectors ---
  const openMenuBtn = document.getElementById("openMenu");
  const closeMenuBtn = document.getElementById("closeMenu");
  const mobileMenu = document.getElementById("mobileMenu");
  const modal = document.getElementById('web3Modal');
  const openBtn = document.getElementById('openDeepDive');
  const closeBtn = document.getElementById('closeModal');
  const backdrop = document.getElementById('modalBackdrop');

  // --- State & Provider Configuration ---
  let lastBlock = 0;
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");

  /**
   * Core Blockchain Logic
   * Fetches data for both the main page cards and the deep-dive modal.
   */
  async function updateAllBlockchainData() {
    // Main Page Elements
    const blockElement = document.getElementById("latest-block");

    // Modal Specific Elements
    const modalBnbPrice = document.getElementById('modal-bnb-price');
    const modalPeers = document.getElementById('modal-peers');
    const txLog = document.getElementById('tx-log');

    try {
      // Parallel fetching using Promise.allSettled to prevent one failure from blocking others
      const results = await Promise.allSettled([
        provider.getBlock("latest"),                                             // 0: Latest Block & TXs
        provider.getFeeData(),                                                   // 1: Gas Data
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT'),    // 2: Market Price
        provider.send("net_peerCount", [])                                       // 3: Network Health
      ]);

      // 1. Process Block & Transactions
      if (results[0].status === 'fulfilled' && results[0].value) {
        const block = results[0].value;

        // Update main page block card
        if (block.number !== lastBlock) {
          blockElement.innerText = `#${block.number}`;
          blockElement.style.color = "#F7EF8A";
          setTimeout(() => { blockElement.style.color = "#D4AF37"; }, 500);
          lastBlock = block.number;

          // Update modal transaction log if modal is open
          if (!modal.classList.contains('hidden') && txLog) {
            const txs = block.transactions.slice(0, 5); // Display last 5 TXs
            txLog.innerHTML = txs.map(tx => `
                <div class="flex justify-between items-center p-2 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <span class="text-gold-500">TX: ${tx.substring(0, 10)}...</span>
                  <span class="text-gray-500 text-[9px]">Confirmed</span>
                </div>
              `).join('');
          }
        }
      }



      // 3. Process Market Price (Only update if modal is visible to save resources)
      if (!modal.classList.contains('hidden') && results[2].status === 'fulfilled') {
        const priceData = await results[2].value.json();
        if (modalBnbPrice) {
          modalBnbPrice.innerText = `$${parseFloat(priceData.price).toFixed(2)}`;
        }
      }

      // 4. Process Network Peers & Health Status
      if (!modal.classList.contains('hidden') && results[3].status === 'fulfilled') {
        const peerCount = parseInt(results[3].value, 16); // Convert Hex to Int
        const peerEl = document.getElementById('modal-peers');
        const dotEl = document.getElementById('peer-status-dot');
        const labelEl = document.getElementById('peer-status-label');

        if (peerEl) peerEl.innerText = peerCount;

        // Network Health Assessment Logic
        if (peerCount <= 5) {
          dotEl.className = "w-2 h-2 rounded-full bg-red-500 animate-pulse";
          labelEl.innerText = "Critical Connection";
          labelEl.className = "text-[9px] uppercase font-mono text-red-500 mt-1 tracking-widest italic";
        } else if (peerCount > 5 && peerCount <= 12) {
          dotEl.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
          labelEl.innerText = "Connecting...";
          labelEl.className = "text-[9px] uppercase font-mono text-yellow-500 mt-1 tracking-widest italic";
        } else {
          dotEl.className = "w-2 h-2 rounded-full bg-green-500";
          labelEl.innerText = "Healthy / Stable";
          labelEl.className = "text-[9px] uppercase font-mono text-green-500 mt-1 tracking-widest italic";
        }
      }

    } catch (error) {
      console.error("Critical Web3 Sync Error:", error);
    }
  }

  // --- Modal Logic ---
  function toggleModal(show) {
    if (show) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      updateAllBlockchainData(); // Immediate fetch on open
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = 'auto';
    }
  }

  // --- Event Listeners ---
  if (openBtn) openBtn.onclick = (e) => { e.preventDefault(); toggleModal(true); };
  closeBtn.onclick = () => toggleModal(false);
  backdrop.onclick = () => toggleModal(false);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) toggleModal(false);
  });

  // Mobile Navigation
  openMenuBtn.addEventListener("click", () => mobileMenu.classList.add("open"));
  closeMenuBtn.addEventListener("click", () => mobileMenu.classList.remove("open"));

  // Scroll Animations
  function checkScroll() {
    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
        el.classList.add("visible");
      }
    });
  }

  // --- Execution ---
  window.addEventListener("scroll", checkScroll);
  checkScroll();

  // Initial fetch
  updateAllBlockchainData();

  // Global sync every 3 seconds
  setInterval(updateAllBlockchainData, 3000);



  //-----------------------backend playground-------------------------
  let requestCount = 0;
  let isTyping = false;
  let typeTimeout; // Store timeout to clear it on reset

  const apiModal = document.getElementById('apiModal');
  const openApiBtn = document.getElementById('openApiPlayground');
  const closeApiBtn = document.getElementById('closeApiModal');
  const sendBtn = document.getElementById('sendRequest');
  const responseArea = document.getElementById('apiResponse');
  const resStatus = document.getElementById('resStatus');
  const copyJson = document.getElementById('copyJson');
  const apiEndpointInput = document.getElementById('apiEndpoint');

  const devData = {
    "status": "success",
    "data": {
      "name": "Sumit Kotiya",
      "role": "Full Stack Intern",
      "tech_stack": ["Android", "PHP", "Node.js", "Solidity"],
      "experience": "1 Year (Coding)",
      "open_to_work": true,
      "coffee_to_code_ratio": "1:1"
    }
  };

  // --- Helper: Reset Playground ---
  function resetPlayground() {
    clearTimeout(typeTimeout);
    isTyping = false;
    requestCount = 0;
    responseArea.innerHTML = '// Click Send to fetch developer data...';
    responseArea.classList.remove('text-green-500', 'text-red-500', 'text-yellow-500');
    responseArea.className = "bg-dark-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto border border-white/5 text-gray-500 italic";
    resStatus.classList.add('hidden');
    copyJson.classList.add('hidden');
    apiEndpointInput.value = "https://api.sumitkotiya.dev/v1/developer/stats";
  }

  // Open/Close logic
  openApiBtn.onclick = () => {
    apiModal.style.display = 'flex';
  };

  closeApiBtn.onclick = () => {
    apiModal.style.display = 'none';
    resetPlayground(); // Reset when user closes
  };

  // Close on backdrop click
  document.getElementById('apiModalBackdrop').onclick = () => {
    apiModal.style.display = 'none';
    resetPlayground();
  };

  // Simulation logic
  sendBtn.onclick = () => {
    if (isTyping) return;

    sendBtn.disabled = true;

    const endpoint = apiEndpointInput.value;
    const correctUrl = "https://api.sumitkotiya.dev/v1/developer/stats";

    requestCount++;
    resStatus.classList.add('hidden');
    copyJson.classList.add('hidden');
    responseArea.innerHTML = '<span class="animate-pulse text-gold-500">Connecting to server...</span>';

    setTimeout(() => {
      let status = "";
      let responseContent = {};
      let statusClass = "";

      if (requestCount > 3) {
        status = "429 Too Many Requests";
        statusClass = "text-yellow-500";
        responseContent = { "error": "Rate limit exceeded", "message": "Whoa! Slow down." };
      } else if (endpoint !== correctUrl) {
        status = "404 Not Found";
        statusClass = "text-red-500";
        responseContent = { "error": "Endpoint not found", "suggestion": "Try the default URL." };
      } else {
        status = "200 OK";
        statusClass = "text-green-500";
        responseContent = devData;
      }

      renderResponse(status, statusClass, responseContent);
    }, 600);
  };

  function renderResponse(status, sClass, data) {
    isTyping = true;
    resStatus.innerText = status;
    resStatus.className = `text-[10px] font-mono ${sClass}`;
    resStatus.classList.remove('hidden');

    copyJson.classList.remove('hidden');

    responseArea.innerHTML = "";
    responseArea.className = `bg-dark-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto border border-white/5 ${sClass}`;

    const jsonStr = JSON.stringify(data, null, 4);
    let i = 0;

    function typeWriter() {
      if (i < jsonStr.length) {
        responseArea.innerHTML += jsonStr.charAt(i);
        i++;
        typeTimeout = setTimeout(typeWriter, 5);
      } else {
        isTyping = false;
      }
    }
    typeWriter();
    sendBtn.disabled = false;
    copyJson.onclick = () => {
      navigator.clipboard.writeText(JSON.stringify(data, null, 4));
      copyJson.innerHTML = '<i class="fas fa-check"></i> COPIED';
      setTimeout(() => {
        copyJson.innerHTML = '<i class="far fa-copy"></i> COPY';
      }, 2000);
    };
  }
  //-----------------------backend playground-------------------------


  const terminalInput = document.getElementById('terminal-input');
  const terminalHistory = document.getElementById('terminal-history');
  const terminalBody = document.getElementById('terminal-body');
  document.getElementById('current-date').innerText = new Date().toDateString();

  const commands = {
    'help': `
            <div class="space-y-2">
                <p class="text-blue-400 font-bold border-b border-blue-900/30 pb-1">COMMAND DIRECTORY</p>
                <div class="grid grid-cols-1 gap-1 text-[11px]">
                    <p><span class="text-gold-400 w-16 inline-block font-bold">about</span> — View developer profile and mission.</p>
                    <p><span class="text-gold-400 w-16 inline-block font-bold">skills</span> — Display technical stack proficiencies.</p>
                    <p><span class="text-gold-400 w-16 inline-block font-bold">resume</span> — <span class="text-green-500">Download CV</span> directly to device.</p>
                    <p><span class="text-gold-400 w-16 inline-block font-bold">clear</span> — Wipe terminal history.</p>
                </div>
                <p class="text-gray-500 text-[10px] mt-2 italic">Try typing one of the commands above.</p>
            </div>`,
    'about': '<span class="text-white font-bold">Sumit Kotiya:</span> Android & Backend Developer specializing in Blockchain integrations.',
    'skills': '<span class="text-white font-bold">Tech Stack:</span> Android (Java), PHP, Node.js, Solidity, MySQL.',
    'resume': '<span class="text-green-400 flex items-center"><i class="fas fa-download mr-2 animate-bounce"></i> Initializing secure download... Sumit_Kotiya_Resume.pdf</span>'
  };

  // --- Auto-Typing Greeting ---
  function startGreeting() {
    const greetText = "Welcome to Interactive Terminal. Type 'help' to explore...";
    const greetDiv = document.createElement('div');
    greetDiv.className = 'text-gold-500/80 italic mb-2';
    terminalHistory.appendChild(greetDiv);

    let i = 0;
    function type() {
      if (i < greetText.length) {
        greetDiv.innerHTML += greetText.charAt(i);
        i++;
        setTimeout(type, 30);
      }
    }
    type();
  }
  startGreeting();

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = terminalInput.value.toLowerCase().trim();

      if (input === 'clear') {
        terminalHistory.innerHTML = '';
        terminalInput.value = '';
        return;
      }

      // 1. Log Command
      const cmdLine = document.createElement('div');
      cmdLine.className = 'flex items-center space-x-2 mt-2';
      cmdLine.innerHTML = `<span class="text-green-500 font-bold">➜</span> <span class="text-gray-500">~</span> <span class="text-white font-medium">${input}</span>`;
      terminalHistory.appendChild(cmdLine);

      // 2. Log Response
      const responseLine = document.createElement('div');
      responseLine.className = 'mt-1 mb-4 ml-4 border-l border-gray-800 pl-4 text-gray-400 leading-relaxed';

      if (input === '') {
        // Ignore empty
      } else if (input === 'resume') {
        responseLine.innerHTML = commands['resume'];
        terminalHistory.appendChild(responseLine);
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = 'sumitkotiya.pdf';
          link.download = 'Sumit_Kotiya_Resume.pdf';
          link.click();
        }, 1000);
      } else if (commands[input]) {
        responseLine.innerHTML = commands[input];
        terminalHistory.appendChild(responseLine);
      } else {
        responseLine.innerHTML = `
                    <span class="text-red-500"><i class="fas fa-times-circle mr-2"></i> command not found: ${input}</span><br>
                    <span class="text-[10px]">Type <span class="text-gold-400">'help'</span> for all available commands.</span>`;
        terminalHistory.appendChild(responseLine);
      }

      terminalInput.value = '';
      terminalBody.scrollTo({ top: terminalBody.scrollHeight, behavior: 'smooth' });
    }
  });

  terminalBody.onclick = () => terminalInput.focus();
  // -------------------------------------------- Terminal Logic ---


  //============Contact Me====================
  document.getElementById('contactForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const submitBtn = this.querySelector('button');
    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await fetch('contact.php', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Thank you for contacting me. I will get back to you soon.");
        this.reset();
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    } finally {
      submitBtn.innerText = "Send Message";
      submitBtn.disabled = false;
    }
  });
  //============Contact Me====================






});


