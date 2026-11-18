/**
 * Schoollyx - Main Client Application Logic
 * Dynamic catalog rendering, interactive filters, quote builder, Genie AI simulator, and ROI calculator
 */

document.addEventListener('DOMContentLoaded', () => {
    // Lucide Icons initialization
    if (window.lucide) {
        lucide.createIcons();
    }

    // State
    const state = {
        activeFilter: 'all',
        searchQuery: '',
        selectedModules: new Set([1, 2, 3, 4, 7, 23, 31, 36]), // pre-select recommended starter pack
        currentModalModule: null,
        activeAppTab: 'parent'
    };

    // DOM Elements
    const modulesGrid = document.getElementById('modules-grid');
    const filterPillsContainer = document.getElementById('filter-pills');
    const searchInput = document.getElementById('module-search');
    const moduleCountDisplay = document.getElementById('module-count-display');
    const quoteCountBadge = document.getElementById('quote-count-badge');
    const floatingQuoteBadge = document.getElementById('floating-quote-count');
    
    // Modals
    const moduleDetailModal = document.getElementById('module-detail-modal');
    const quoteDrawer = document.getElementById('quote-drawer');
    const demoModal = document.getElementById('demo-modal');

    // -------------------------------------------------------------
    // 1. Render Category Filter Pills
    // -------------------------------------------------------------
    function renderFilterPills() {
        if (!filterPillsContainer) return;
        
        filterPillsContainer.innerHTML = SCHOOLLYX_DATA.pillars.map(pillar => {
            const isActive = state.activeFilter === pillar.id;
            return `
                <button 
                    data-filter="${pillar.id}" 
                    class="filter-btn px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                    }">
                    <span>${pillar.name}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-700/60 text-white' : 'bg-slate-100 text-slate-500'}">
                        ${pillar.count}
                    </span>
                </button>
            `;
        }).join('');

        // Attach listeners
        filterPillsContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeFilter = btn.dataset.filter;
                renderFilterPills();
                renderModules();
            });
        });
    }

    // -------------------------------------------------------------
    // 2. Render Module Cards in Grid
    // -------------------------------------------------------------
    function renderModules() {
        if (!modulesGrid) return;

        let filtered = SCHOOLLYX_DATA.modules.filter(mod => {
            // Category check
            let matchesCategory = true;
            if (state.activeFilter === 'key') {
                matchesCategory = mod.isKey;
            } else if (state.activeFilter !== 'all') {
                matchesCategory = mod.category === state.activeFilter;
            }

            // Search query check
            let matchesSearch = true;
            if (state.query && state.query.trim() !== '') {
                const q = state.query.toLowerCase().trim();
                const inTitle = mod.title.toLowerCase().includes(q);
                const inDesc = mod.description.toLowerCase().includes(q);
                const inStat = mod.stat.toLowerCase().includes(q);
                const inFeatures = mod.features.some(f => f.toLowerCase().includes(q));
                matchesSearch = inTitle || inDesc || inStat || inFeatures;
            }

            return matchesCategory && matchesSearch;
        });

        // Update count text
        if (moduleCountDisplay) {
            moduleCountDisplay.textContent = `Showing ${filtered.length} of 38 Modules`;
        }

        if (filtered.length === 0) {
            modulesGrid.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="search" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800">No modules found</h3>
                    <p class="text-sm text-slate-500 mt-1">Try tweaking your search term or switch categories.</p>
                    <button id="reset-filter-btn" class="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-lg hover:bg-indigo-100 transition">
                        Reset Filters
                    </button>
                </div>
            `;
            const resetBtn = document.getElementById('reset-filter-btn');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    state.activeFilter = 'all';
                    state.query = '';
                    if (searchInput) searchInput.value = '';
                    renderFilterPills();
                    renderModules();
                });
            }
            if (window.lucide) lucide.createIcons();
            return;
        }

        modulesGrid.innerHTML = filtered.map(mod => {
            const isSelected = state.selectedModules.has(mod.id);
            return `
                <div class="module-card group bg-white rounded-2xl p-6 border ${mod.isKey ? 'border-amber-200 shadow-sm shadow-amber-100/50' : 'border-slate-200/90'} flex flex-col justify-between hover:border-indigo-400">
                    <div>
                        <!-- Header with ID and Badges -->
                        <div class="flex items-start justify-between gap-3 mb-4">
                            <div class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                                    #${mod.id.toString().padStart(2, '0')}
                                </span>
                                <div class="w-10 h-10 rounded-xl ${mod.isKey ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <i data-lucide="${mod.icon}" class="w-5 h-5"></i>
                                </div>
                            </div>
                            
                            <div class="flex flex-col items-end gap-1">
                                ${mod.isKey ? `
                                    <span class="key-badge text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                        ⭐ KEY MODULE
                                    </span>
                                ` : ''}
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    ${mod.stat}
                                </span>
                            </div>
                        </div>

                        <!-- Title & Tagline -->
                        <h3 class="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            ${mod.title}
                        </h3>
                        <p class="text-xs font-medium text-indigo-500 mt-0.5 mb-2.5">
                            ${mod.tagline}
                        </p>
                        <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            ${mod.description}
                        </p>

                        <!-- Key Features Preview (Top 3) -->
                        <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                            ${mod.features.slice(0, 3).map(feat => `
                                <div class="text-[12px] text-slate-600 flex items-center gap-1.5 truncate">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                    <span class="truncate">${feat}</span>
                                </div>
                            `).join('')}
                            ${mod.features.length > 3 ? `
                                <div class="text-[11px] font-semibold text-slate-400 pl-3">
                                    +${mod.features.length - 3} more capabilities
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button 
                            onclick="window.openModuleDetail(${mod.id})" 
                            class="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1 transition">
                            <span>Deep Dive</span>
                            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                        </button>

                        <button 
                            onclick="window.toggleModuleSelection(${mod.id})"
                            class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                                isSelected 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                            }">
                            <i data-lucide="${isSelected ? 'check' : 'plus'}" class="w-3.5 h-3.5"></i>
                            <span>${isSelected ? 'In My Package' : 'Add to Plan'}</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // -------------------------------------------------------------
    // 3. Selection & Quote Cart Management
    // -------------------------------------------------------------
    window.toggleModuleSelection = function(id) {
        if (state.selectedModules.has(id)) {
            state.selectedModules.delete(id);
            showToast(`Removed Module #${id} from customized plan`);
        } else {
            state.selectedModules.add(id);
            showToast(`Added Module #${id} to customized plan`);
        }
        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
    };

    function updateQuoteBadges() {
        const count = state.selectedModules.size;
        if (quoteCountBadge) quoteCountBadge.textContent = count;
        if (floatingQuoteBadge) floatingQuoteBadge.textContent = count;
    }

    window.selectAllModules = function() {
        SCHOOLLYX_DATA.modules.forEach(m => state.selectedModules.add(m.id));
        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
        showToast('All 38 modules selected for complete ERP suite');
    };

    window.resetModuleSelection = function() {
        state.selectedModules.clear();
        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
        showToast('Selection cleared');
    };

    // -------------------------------------------------------------
    // 4. Module Detail Modal
    // -------------------------------------------------------------
    window.openModuleDetail = function(id) {
        const mod = SCHOOLLYX_DATA.modules.find(m => m.id === id);
        if (!mod || !moduleDetailModal) return;

        state.currentModalModule = mod;
        const isSelected = state.selectedModules.has(mod.id);

        document.getElementById('modal-module-id').textContent = `#${mod.id.toString().padStart(2, '0')}`;
        document.getElementById('modal-module-title').textContent = mod.title;
        document.getElementById('modal-module-tagline').textContent = mod.tagline;
        document.getElementById('modal-module-stat').textContent = mod.stat;
        document.getElementById('modal-module-category').textContent = mod.categoryName;
        document.getElementById('modal-module-desc').textContent = mod.description;

        const keyBadgeEl = document.getElementById('modal-key-badge');
        if (keyBadgeEl) {
            keyBadgeEl.style.display = mod.isKey ? 'inline-flex' : 'none';
        }

        const featuresListEl = document.getElementById('modal-features-list');
        if (featuresListEl) {
            featuresListEl.innerHTML = mod.features.map(feat => `
                <li class="flex items-start gap-2.5 text-sm text-slate-700">
                    <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    </span>
                    <span>${feat}</span>
                </li>
            `).join('');
        }

        const modalAddBtn = document.getElementById('modal-toggle-package-btn');
        if (modalAddBtn) {
            modalAddBtn.className = `w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition ${
                isSelected 
                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/25'
            }`;
            modalAddBtn.innerHTML = `
                <i data-lucide="${isSelected ? 'trash-2' : 'plus-circle'}" class="w-4 h-4"></i>
                <span>${isSelected ? 'Remove from My Custom Package' : 'Include in My Custom School Package'}</span>
            `;
            modalAddBtn.onclick = () => {
                window.toggleModuleSelection(mod.id);
                window.openModuleDetail(mod.id); // refresh modal state
            };
        }

        moduleDetailModal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    };

    window.closeModuleDetail = function() {
        if (moduleDetailModal) moduleDetailModal.classList.add('hidden');
    };

    // -------------------------------------------------------------
    // 5. Quote Drawer / Package Builder
    // -------------------------------------------------------------
    window.openQuoteDrawer = function() {
        if (!quoteDrawer) return;
        renderQuoteDrawer();
        quoteDrawer.classList.remove('hidden');
    };

    window.closeQuoteDrawer = function() {
        if (!quoteDrawer) return;
        quoteDrawer.classList.add('hidden');
    };

    function renderQuoteDrawer() {
        const container = document.getElementById('quote-selected-list');
        const countDisplay = document.getElementById('quote-drawer-count');
        if (!container) return;

        const selectedList = SCHOOLLYX_DATA.modules.filter(m => state.selectedModules.has(m.id));
        if (countDisplay) {
            countDisplay.textContent = `${selectedList.length} Selected`;
        }

        if (selectedList.length === 0) {
            container.innerHTML = `
                <div class="py-12 text-center text-slate-400">
                    <i data-lucide="package-open" class="w-12 h-12 mx-auto mb-3 opacity-60"></i>
                    <p class="text-sm font-semibold text-slate-600">Your package is currently empty</p>
                    <p class="text-xs text-slate-400 mt-1">Select modules from the catalog above to build your custom proposal.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = selectedList.map(mod => `
            <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="text-xs font-bold text-slate-400">#${mod.id}</span>
                    <div class="truncate">
                        <div class="text-xs font-bold text-slate-800 truncate">${mod.title}</div>
                        <div class="text-[11px] text-slate-500">${mod.categoryName}</div>
                    </div>
                </div>
                <button onclick="window.toggleModuleSelection(${mod.id})" class="text-slate-400 hover:text-rose-500 p-1 rounded-md transition">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    }

    window.submitCustomQuote = function() {
        const name = document.getElementById('quote-school-name')?.value || 'School Leader';
        const contact = document.getElementById('quote-contact')?.value || '';
        const students = document.getElementById('quote-student-count')?.value || '1000';
        
        const selectedList = SCHOOLLYX_DATA.modules.filter(m => state.selectedModules.has(m.id));
        const moduleNames = selectedList.map(m => `#${m.id} ${m.title}`).join(', ');

        const text = encodeURIComponent(
            `*Schoollyx Official ERP Inquiry*\n` +
            `*School:* ${name}\n` +
            `*Phone/Email:* ${contact}\n` +
            `*Estimated Students:* ${students}\n` +
            `*Selected Modules (${selectedList.length}):*\n${moduleNames}\n\n` +
            `Please share customized quote & setup timeline.`
        );

        const whatsappUrl = `https://wa.me/${SCHOOLLYX_DATA.company.phoneRaw}?text=${text}`;
        window.open(whatsappUrl, '_blank');
        showToast('Redirecting to WhatsApp with your customized module request!');
        window.closeQuoteDrawer();
    };

    // -------------------------------------------------------------
    // 6. Interactive Genie AI Simulator
    // -------------------------------------------------------------
    const geniePrompts = [
        {
            query: "Show fee collection summary and pending defaulters for Class 10",
            response: {
                title: "Class 10 Fee Status (November 2026)",
                stat1: "₹6,80,000 Collected (91%)",
                stat2: "14 Defaulters Pending",
                time: "1.2s",
                actions: ["Send WhatsApp Notice to Defaulters", "Export PDF Report"]
            }
        },
        {
            query: "What is today's school attendance percentage and absent list?",
            response: {
                title: "Live Campus Attendance (Today)",
                stat1: "98.6% Student Attendance",
                stat2: "18 Students Absent (10 unexcused)",
                time: "0.8s",
                actions: ["Send Automated SMS to Parents", "View Class-Wise Breakdown"]
            }
        },
        {
            query: "Generate CBSE compliant Term-1 Report Cards for Grade 8",
            response: {
                title: "CBSE Term-1 Grade Tabulation Complete",
                stat1: "128 Report Cards Compiled",
                stat2: "100% Accuracy Verified",
                time: "1.7s",
                actions: ["Publish to Parent Mobile App", "Print Watermarked PDFs"]
            }
        },
        {
            query: "Check School Bus 04 live location and delay status",
            response: {
                title: "Bus Route 04: North Campus Express",
                stat1: "GPS Active: Near Sector 24 Stop",
                stat2: "On Schedule (ETA School: 8:15 AM)",
                time: "0.5s",
                actions: ["Live Map Stream", "Notify Approaching Stops"]
            }
        }
    ];

    window.runGenieSimulation = function(index) {
        const item = geniePrompts[index];
        const queryDisplay = document.getElementById('genie-sim-query');
        const cardDisplay = document.getElementById('genie-sim-result');
        const loader = document.getElementById('genie-sim-loader');

        if (!queryDisplay || !cardDisplay) return;

        queryDisplay.textContent = `"${item.query}"`;
        cardDisplay.classList.add('hidden');
        if (loader) loader.classList.remove('hidden');

        // Fast simulated AI latency (< 1.5s)
        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
            cardDisplay.innerHTML = `
                <div class="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 text-white space-y-3 animate-float">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            <span class="text-xs font-bold text-indigo-400 tracking-wide uppercase">Genie Response</span>
                        </div>
                        <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            ⚡ ${item.response.time}
                        </span>
                    </div>

                    <div class="text-sm font-bold text-slate-100">${item.response.title}</div>

                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                            <span class="text-slate-400 text-[10px] block">Metric 1</span>
                            <span class="font-bold text-emerald-400">${item.response.stat1}</span>
                        </div>
                        <div class="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
                            <span class="text-slate-400 text-[10px] block">Metric 2</span>
                            <span class="font-bold text-cyan-400">${item.response.stat2}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                        ${item.response.actions.map(act => `
                            <button class="px-2.5 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-semibold transition">
                                ${act}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
            cardDisplay.classList.remove('hidden');
        }, 900);
    };

    // -------------------------------------------------------------
    // 7. Interactive ROI & Savings Calculator
    // -------------------------------------------------------------
    const studentSlider = document.getElementById('calc-students');
    const feeSlider = document.getElementById('calc-fee');

    function calculateROI() {
        if (!studentSlider || !feeSlider) return;

        const students = parseInt(studentSlider.value, 10);
        const annualFee = parseInt(feeSlider.value, 10);

        document.getElementById('calc-students-val').textContent = students.toLocaleString();
        document.getElementById('calc-fee-val').textContent = `₹${annualFee.toLocaleString()}`;

        // Formulas based on catalog stats:
        // 70% admin time saved ~ approx 0.15 hours saved per student per year
        const hoursSavedMonthly = Math.round((students * 1.8) / 12);
        
        // 45% faster fee collection & reducing uncollected bad debts by ~1.5% of gross collections
        const grossFeeCollection = students * annualFee;
        const estimatedFeeRecovery = Math.round(grossFeeCollection * 0.02);
        
        // Administrative stationery/paperless savings (approx ₹350 per student saved on reports, ID cards, forms)
        const paperlessSavings = Math.round(students * 350);

        const totalAnnualSavings = estimatedFeeRecovery + paperlessSavings;

        document.getElementById('calc-hours-saved').textContent = `${hoursSavedMonthly} hrs/mo`;
        document.getElementById('calc-annual-savings').textContent = `₹${(totalAnnualSavings / 100000).toFixed(2)} Lakhs`;
        document.getElementById('calc-collection-speed').textContent = `45% Faster`;
    }

    if (studentSlider && feeSlider) {
        studentSlider.addEventListener('input', calculateROI);
        feeSlider.addEventListener('input', calculateROI);
        calculateROI();
    }

    // -------------------------------------------------------------
    // 8. Mobile Apps 3-Tab Switcher
    // -------------------------------------------------------------
    window.switchAppPreview = function(tab) {
        state.activeAppTab = tab;
        document.querySelectorAll('.app-tab-btn').forEach(btn => {
            const isTarget = btn.dataset.tab === tab;
            btn.className = `app-tab-btn px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isTarget 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`;
        });

        const parentScreen = document.getElementById('phone-screen-parent');
        const teacherScreen = document.getElementById('phone-screen-teacher');
        const adminScreen = document.getElementById('phone-screen-admin');

        if (parentScreen && teacherScreen && adminScreen) {
            parentScreen.classList.toggle('hidden', tab !== 'parent');
            teacherScreen.classList.toggle('hidden', tab !== 'teacher');
            adminScreen.classList.toggle('hidden', tab !== 'admin');
        }
    };

    // -------------------------------------------------------------
    // 9. Toast Notifications
    // -------------------------------------------------------------
    function showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 z-50';
        toast.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    window.showToast = showToast;

    // -------------------------------------------------------------
    // 10. Search Listener
    // -------------------------------------------------------------
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.query = e.target.value;
            renderModules();
        });
    }

    // -------------------------------------------------------------
    // 11. Lead / Demo Modal Handlers
    // -------------------------------------------------------------
    window.openDemoModal = function() {
        if (demoModal) demoModal.classList.remove('hidden');
    };
    window.closeDemoModal = function() {
        if (demoModal) demoModal.classList.add('hidden');
    };

    window.submitDemoRequest = function(event) {
        if (event) event.preventDefault();
        const school = document.getElementById('demo-school-name')?.value || 'Our School';
        const phone = document.getElementById('demo-phone')?.value || '';
        const name = document.getElementById('demo-rep-name')?.value || 'Admin';

        const text = encodeURIComponent(
            `*Schoollyx Live Demo Request*\n` +
            `*School:* ${school}\n` +
            `*Name:* ${name}\n` +
            `*Phone:* ${phone}\n` +
            `I want to schedule a live demo of the 38-module Schoollyx ERP.`
        );

        const whatsappUrl = `https://wa.me/${SCHOOLLYX_DATA.company.phoneRaw}?text=${text}`;
        window.open(whatsappUrl, '_blank');
        window.closeDemoModal();
        showToast('Demo request registered! Opening WhatsApp.');
    };

    // Initialize View
    renderFilterPills();
    renderModules();
    updateQuoteBadges();
    runGenieSimulation(0);
});
