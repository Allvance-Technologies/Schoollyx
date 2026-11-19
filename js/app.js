/**
 * Schoollyx - Main Client Application Logic (Production Clean & Mobile-Optimized)
 * Dynamic catalog rendering, presets, interactive filters, quote builder,
 * Genie AI simulator, portal gateway modal, scrollspy, mobile menu, and ROI calculator.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Lucide Icons initialization
    if (window.lucide) {
        lucide.createIcons();
    }

    // State
    const state = {
        activeFilter: 'all',
        activePreset: 'starter',
        searchQuery: '',
        selectedModules: new Set(SCHOOLLYX_DATA.presets.starter.moduleIds),
        currentModalModule: null,
        activeAppTab: 'parent',
        activeLoginRole: 'admin',
        isMobileMenuOpen: false
    };

    // DOM Elements
    const modulesGrid = document.getElementById('modules-grid');
    const filterPillsContainer = document.getElementById('filter-pills');
    const searchInput = document.getElementById('module-search');
    const moduleCountDisplay = document.getElementById('module-count-display');
    const quoteCountBadge = document.getElementById('quote-count-badge');
    const floatingQuoteBadge = document.getElementById('floating-quote-count');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
    
    // Modals & Drawers
    const moduleDetailModal = document.getElementById('module-detail-modal');
    const quoteDrawer = document.getElementById('quote-drawer');
    const demoModal = document.getElementById('demo-modal');
    const loginModal = document.getElementById('login-modal');
    const whitepaperModal = document.getElementById('whitepaper-modal');

    // -------------------------------------------------------------
    // 0. Mobile Menu Logic
    // -------------------------------------------------------------
    window.toggleMobileMenu = function() {
        state.isMobileMenuOpen = !state.isMobileMenuOpen;
        if (mobileMenuDrawer) {
            mobileMenuDrawer.classList.toggle('hidden', !state.isMobileMenuOpen);
        }
    };

    window.closeMobileMenu = function() {
        state.isMobileMenuOpen = false;
        if (mobileMenuDrawer) {
            mobileMenuDrawer.classList.add('hidden');
        }
    };

    // -------------------------------------------------------------
    // 1. Presets Logic (Reduce Decision Fatigue)
    // -------------------------------------------------------------
    window.applyPreset = function(presetKey) {
        const preset = SCHOOLLYX_DATA.presets[presetKey];
        if (!preset) return;

        state.activePreset = presetKey;
        state.selectedModules = new Set(preset.moduleIds);

        // Update button active styling
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const isCurrent = btn.dataset.preset === presetKey;
            btn.classList.toggle('ring-2', isCurrent);
            btn.classList.toggle('ring-indigo-600', isCurrent);
            btn.classList.toggle('bg-white', !isCurrent);
            btn.classList.toggle('bg-indigo-50', isCurrent);
        });

        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
        showToast(`Selected "${preset.name}" (${preset.moduleIds.length} capabilities loaded)`);
    };

    // -------------------------------------------------------------
    // 2. Render Category Filter Pills
    // -------------------------------------------------------------
    function renderFilterPills() {
        if (!filterPillsContainer) return;
        
        filterPillsContainer.innerHTML = SCHOOLLYX_DATA.pillars.map(pillar => {
            const isActive = state.activeFilter === pillar.id;
            return `
                <button 
                    data-filter="${pillar.id}" 
                    class="filter-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                        isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                    }">
                    <span>${pillar.name}</span>
                    <span class="text-[11px] px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-700/60 text-white' : 'bg-slate-100 text-slate-500'}">
                        ${pillar.count}
                    </span>
                </button>
            `;
        }).join('');

        filterPillsContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeFilter = btn.dataset.filter;
                renderFilterPills();
                renderModules();
            });
        });
    }

    // -------------------------------------------------------------
    // 3. Render Module Cards in Grid
    // -------------------------------------------------------------
    function renderModules() {
        if (!modulesGrid) return;

        let filtered = SCHOOLLYX_DATA.modules.filter(mod => {
            let matchesCategory = true;
            if (state.activeFilter === 'key') {
                matchesCategory = mod.isKey;
            } else if (state.activeFilter !== 'all') {
                matchesCategory = mod.category === state.activeFilter;
            }

            let matchesSearch = true;
            if (state.query && state.query.trim() !== '') {
                const q = state.query.toLowerCase().trim();
                const inTitle = mod.title.toLowerCase().includes(q);
                const inDesc = mod.description.toLowerCase().includes(q);
                const inStat = mod.stat.toLowerCase().includes(q);
                const inBadges = (mod.badges || []).some(b => b.toLowerCase().includes(q));
                const inFeatures = mod.features.some(f => f.toLowerCase().includes(q));
                matchesSearch = inTitle || inDesc || inStat || inBadges || inFeatures;
            }

            return matchesCategory && matchesSearch;
        });

        if (moduleCountDisplay) {
            moduleCountDisplay.textContent = `Showing ${filtered.length} Capabilities`;
        }

        if (filtered.length === 0) {
            modulesGrid.innerHTML = `
                <div class="col-span-full py-16 text-center">
                    <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="search" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-lg font-bold text-slate-800">No capabilities found</h3>
                    <p class="text-sm text-slate-500 mt-1">Try tweaking your search term or reset filters.</p>
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
                <div class="module-card group bg-white rounded-2xl p-5 sm:p-6 border ${mod.isKey ? 'border-amber-200 shadow-sm shadow-amber-100/50' : 'border-slate-200/90'} flex flex-col justify-between hover:border-indigo-400">
                    <div>
                        <!-- Header with Badges -->
                        <div class="flex items-start justify-between gap-3 mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl ${mod.isKey ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <i data-lucide="${mod.icon}" class="w-5 h-5"></i>
                                </div>
                                <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                                    ${mod.categoryName}
                                </span>
                            </div>
                            
                            <div class="flex flex-col items-end gap-1 flex-shrink-0">
                                ${mod.isKey ? `
                                    <span class="key-badge text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                        ⭐ KEY MODULE
                                    </span>
                                ` : ''}
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                    ${mod.stat}
                                </span>
                            </div>
                        </div>

                        <!-- Title & Tagline -->
                        <h3 class="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            ${mod.title}
                        </h3>
                        <p class="text-xs font-medium text-indigo-500 mt-0.5 mb-2.5">
                            ${mod.tagline}
                        </p>
                        <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            ${mod.description}
                        </p>

                        <!-- Compliance Badges -->
                        <div class="flex flex-wrap gap-1.5 mt-3">
                            ${(mod.badges || []).slice(0, 3).map(b => `
                                <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 border border-slate-200/70 text-slate-600">
                                    ${b}
                                </span>
                            `).join('')}
                        </div>

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
                                    +${mod.features.length - 3} more features
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
    // 4. Selection & Quote Cart Management
    // -------------------------------------------------------------
    window.toggleModuleSelection = function(id) {
        if (state.selectedModules.has(id)) {
            state.selectedModules.delete(id);
            showToast(`Removed from customized plan`);
        } else {
            state.selectedModules.add(id);
            showToast(`Added to customized plan`);
        }
        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
    };

    function updateQuoteBadges() {
        const count = state.selectedModules.size;
        if (quoteCountBadge) quoteCountBadge.textContent = count;
        if (floatingQuoteBadge) floatingQuoteBadge.textContent = count;
        const mobileBottomCount = document.getElementById('mobile-bottom-quote-count');
        if (mobileBottomCount) mobileBottomCount.textContent = count;
    }

    window.selectAllModules = function() {
        SCHOOLLYX_DATA.modules.forEach(m => state.selectedModules.add(m.id));
        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
        showToast('All modules included in comprehensive proposal');
    };

    window.resetModuleSelection = function() {
        state.selectedModules.clear();
        updateQuoteBadges();
        renderModules();
        renderQuoteDrawer();
        showToast('Selection cleared');
    };

    // -------------------------------------------------------------
    // 5. Module Detail Modal
    // -------------------------------------------------------------
    window.openModuleDetail = function(id) {
        const mod = SCHOOLLYX_DATA.modules.find(m => m.id === id);
        if (!mod || !moduleDetailModal) return;

        state.currentModalModule = mod;
        const isSelected = state.selectedModules.has(mod.id);

        document.getElementById('modal-module-title').textContent = mod.title;
        document.getElementById('modal-module-tagline').textContent = mod.tagline;
        document.getElementById('modal-module-stat').textContent = mod.stat;
        document.getElementById('modal-module-category').textContent = mod.categoryName;
        document.getElementById('modal-module-desc').textContent = mod.description;

        const keyBadgeEl = document.getElementById('modal-key-badge');
        if (keyBadgeEl) {
            keyBadgeEl.style.display = mod.isKey ? 'inline-flex' : 'none';
        }

        const badgesContainer = document.getElementById('modal-badges-container');
        if (badgesContainer) {
            badgesContainer.innerHTML = (mod.badges || []).map(b => `
                <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                    <i data-lucide="check" class="w-3.5 h-3.5 text-indigo-500"></i>
                    <span>${b}</span>
                </span>
            `).join('');
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
                window.openModuleDetail(mod.id);
            };
        }

        moduleDetailModal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    };

    window.closeModuleDetail = function() {
        if (moduleDetailModal) moduleDetailModal.classList.add('hidden');
    };

    // -------------------------------------------------------------
    // 6. Quote Drawer / Package Builder
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
            countDisplay.textContent = `${selectedList.length} Modules in Package`;
        }

        if (selectedList.length === 0) {
            container.innerHTML = `
                <div class="py-12 text-center text-slate-400">
                    <i data-lucide="package-open" class="w-12 h-12 mx-auto mb-3 opacity-60"></i>
                    <p class="text-sm font-semibold text-slate-600">Your package is currently empty</p>
                    <p class="text-xs text-slate-400 mt-1">Select modules from the catalog above or pick a quick preset.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        container.innerHTML = selectedList.map(mod => `
            <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="truncate">
                        <div class="text-xs font-bold text-slate-800 truncate">${mod.title}</div>
                        <div class="text-[11px] text-slate-500">${mod.categoryName} · ${mod.stat}</div>
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
        const moduleNames = selectedList.map(m => m.title).join(', ');

        const text = encodeURIComponent(
            `*Schoollyx Official ERP Inquiry*\n` +
            `*School:* ${name}\n` +
            `*Phone/Email:* ${contact}\n` +
            `*Estimated Students:* ${students}\n` +
            `*Selected Modules (${selectedList.length}):*\n${moduleNames}\n\n` +
            `Please share customized quote & setup timeline for our campus.`
        );

        const whatsappUrl = `https://wa.me/${SCHOOLLYX_DATA.company.phoneRaw}?text=${text}`;
        window.open(whatsappUrl, '_blank');
        showToast('Opening WhatsApp with your customized school requirements!');
        window.closeQuoteDrawer();
    };

    // -------------------------------------------------------------
    // 7. Interactive Genie AI Simulator
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

                    <div class="flex items-center gap-2 pt-1 flex-wrap">
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
    // 8. Portal Login Gateway Modal (Like Schoolites)
    // -------------------------------------------------------------
    window.openLoginModal = function(role = 'admin') {
        state.activeLoginRole = role;
        if (!loginModal) return;

        document.querySelectorAll('.login-role-tab').forEach(tab => {
            const isMatch = tab.dataset.role === role;
            tab.className = `login-role-tab flex-1 py-2.5 rounded-xl font-bold text-xs text-center transition ${
                isMatch ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`;
        });

        const titleEl = document.getElementById('login-modal-role-title');
        const descEl = document.getElementById('login-modal-role-desc');
        if (titleEl) {
            const titles = {
                admin: "School Administrator & Management Portal",
                teacher: "Teacher & Staff Academic Portal",
                parent: "Parent & Guardian Gateway",
                student: "Student Learning & Exam Portal"
            };
            titleEl.textContent = titles[role] || "School Portal Login";
        }
        if (descEl) {
            const descs = {
                admin: "Access daily collections, executive dashboard, attendance logs, and staff management.",
                teacher: "Mark period attendance, upload homework assignments, and compile term grades.",
                parent: "Pay school fees with 10+ gateways, monitor live bus GPS, and view digital report cards.",
                student: "Access homework schedules, online classes, syllabus materials, and exam datesheets."
            };
            descEl.textContent = descs[role] || "Enter your institutional credentials.";
        }

        loginModal.classList.remove('hidden');
    };

    window.closeLoginModal = function() {
        if (loginModal) loginModal.classList.add('hidden');
    };

    window.submitLoginDemo = function(e) {
        if (e) e.preventDefault();
        const subdomain = document.getElementById('login-subdomain')?.value || 'demo';
        showToast(`Redirecting to ${subdomain}.schoollyx.in/${state.activeLoginRole}...`);
        setTimeout(() => {
            alert(`Demo Gateway: In full production, this forwards directly to your dedicated SSL subdomain (${subdomain}.schoollyx.in). To deploy for your school, contact our onboarding team at +91 8754671568.`);
            window.closeLoginModal();
        }, 600);
    };

    // -------------------------------------------------------------
    // 9. Whitepaper / Implementation Guide Modal
    // -------------------------------------------------------------
    window.openWhitepaperModal = function() {
        if (whitepaperModal) whitepaperModal.classList.remove('hidden');
    };
    window.closeWhitepaperModal = function() {
        if (whitepaperModal) whitepaperModal.classList.add('hidden');
    };
    window.submitWhitepaperRequest = function(e) {
        if (e) e.preventDefault();
        const name = document.getElementById('whitepaper-name')?.value || 'School Leader';
        const phone = document.getElementById('whitepaper-phone')?.value || '';
        const school = document.getElementById('whitepaper-school')?.value || 'Institution';

        const text = encodeURIComponent(
            `*Schoollyx 2026 ERP Implementation Guide Request*\n` +
            `*Name:* ${name}\n` +
            `*School:* ${school}\n` +
            `*Phone:* ${phone}\n` +
            `Please share the 2026 School ERP Implementation Guide & Pricing Matrix.`
        );

        window.open(`https://wa.me/${SCHOOLLYX_DATA.company.phoneRaw}?text=${text}`, '_blank');
        window.closeWhitepaperModal();
        showToast('Request sent! Guide will be shared on WhatsApp.');
    };

    // -------------------------------------------------------------
    // 10. Interactive ROI & Savings Calculator
    // -------------------------------------------------------------
    const studentSlider = document.getElementById('calc-students');
    const feeSlider = document.getElementById('calc-fee');

    function calculateROI() {
        if (!studentSlider || !feeSlider) return;

        const students = parseInt(studentSlider.value, 10);
        const annualFee = parseInt(feeSlider.value, 10);

        document.getElementById('calc-students-val').textContent = students.toLocaleString();
        document.getElementById('calc-fee-val').textContent = `₹${annualFee.toLocaleString()}`;

        const hoursSavedMonthly = Math.round((students * 1.8) / 12);
        const grossFeeCollection = students * annualFee;
        const estimatedFeeRecovery = Math.round(grossFeeCollection * 0.02);
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
    // 11. Mobile Apps 3-Tab Switcher (Mobile & Desktop Aware)
    // -------------------------------------------------------------
    window.switchAppPreview = function(tab) {
        state.activeAppTab = tab;
        document.querySelectorAll('.app-tab-btn').forEach(btn => {
            const isTarget = btn.dataset.tab === tab;
            btn.className = `app-tab-btn px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                isTarget 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`;
        });

        const parentMockup = document.getElementById('phone-mockup-parent');
        const teacherMockup = document.getElementById('phone-mockup-teacher');
        const adminMockup = document.getElementById('phone-mockup-admin');

        if (parentMockup && teacherMockup && adminMockup) {
            if (window.innerWidth < 1024) {
                // On mobile/tablet, show only the active app
                parentMockup.style.display = tab === 'parent' ? 'block' : 'none';
                teacherMockup.style.display = tab === 'teacher' ? 'block' : 'none';
                adminMockup.style.display = tab === 'admin' ? 'block' : 'none';
            } else {
                // On desktop, show all 3 side-by-side and highlight active
                parentMockup.style.display = 'block';
                teacherMockup.style.display = 'block';
                adminMockup.style.display = 'block';

                parentMockup.classList.toggle('ring-4', tab === 'parent');
                parentMockup.classList.toggle('ring-indigo-500/50', tab === 'parent');
                teacherMockup.classList.toggle('ring-4', tab === 'teacher');
                teacherMockup.classList.toggle('ring-indigo-500/50', tab === 'teacher');
                adminMockup.classList.toggle('ring-4', tab === 'admin');
                adminMockup.classList.toggle('ring-indigo-500/50', tab === 'admin');
            }
        }
    };

    window.addEventListener('resize', () => {
        window.switchAppPreview(state.activeAppTab);
    });

    // -------------------------------------------------------------
    // 12. Navbar Scrollspy
    // -------------------------------------------------------------
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSection = '';
        const scrollPosition = window.scrollY + 120;

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
                currentSection = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    // -------------------------------------------------------------
    // 13. Toast Notifications
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
    // 14. Search Listener
    // -------------------------------------------------------------
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.query = e.target.value;
            renderModules();
        });
    }

    // -------------------------------------------------------------
    // 15. Lead / Demo Modal Handlers
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
            `I want to schedule a live demo of the Schoollyx AI Operating System.`
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
    window.switchAppPreview('parent');
});
