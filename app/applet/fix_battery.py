import sys

with open("src/App.tsx", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# We look for the exact mangled line prefix
idx = content.find('                          <div className="flex items-ce    { id: \'expert\'')
if idx == -1:
    idx = content.find('                          <div className="flex items-ce    { id: "expert"')

if idx == -1:
    print("Mangled line prefix not found")
    sys.exit(1)

# Find the end of line 7337 (which is the ending of duplicate sidebarLinks array `  ];`)
end_marker = "  ];"
end_idx = content.find(end_marker, idx)
if end_idx == -1:
    print("End marker not found")
    sys.exit(1)

replacement = """                          <div className="flex items-center gap-3 bg-slate-950/80 p-1.5 rounded-3xl border-2 border-white/5 shadow-inner">
                            <button 
                              type="button"
                              onClick={() => {
                                const current = parseInt(String(group.count)) || 1;
                                const newCount = Math.max(1, current - 1);
                                setState(prev => ({
                                  ...prev,
                                  batteryGroups: prev.batteryGroups.map(g => g.id === group.id ? { ...g, count: newCount } : g)
                                }));
                              }}
                              className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-90 border border-white/5 shadow-lg"
                            >
                              <Minus size={20} strokeWidth={3} />
                            </button>
                            <div className="flex-1 flex flex-col items-center justify-center">
                              <input 
                                type="text"
                                inputMode="numeric"
                                value={group.count}
                                onChange={e => {
                                  const val = e.target.value.replace(/\\D/g, '');
                                  setState(prev => ({
                                    ...prev,
                                    batteryGroups: prev.batteryGroups.map(g => g.id === group.id ? { ...g, count: val } : g)
                                  }));
                                }}
                                className="w-full bg-transparent border-none text-center font-black text-2xl text-white focus:ring-0 p-0 leading-none"
                              />
                              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">وحدة</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const current = parseInt(String(group.count)) || 1;
                                const newCount = current + 1;
                                setState(prev => ({
                                  ...prev,
                                  batteryGroups: prev.batteryGroups.map(g => g.id === group.id ? { ...g, count: newCount } : g)
                                }));
                              }}
                              className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-500 transition-all active:scale-90 shadow-xl shadow-blue-600/30 border border-white/10"
                            >
                              <Plus size={20} strokeWidth={3} />
                            </button>
                          </div>
                        </div>

                        {/* Dimensions */}
                        <div>
                          <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">الطول (م)</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={group.length}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\\d*\\.?\\d*$/.test(val)) {
                                setState(prev => ({
                                  ...prev,
                                  batteryGroups: prev.batteryGroups.map(g => g.id === group.id ? { ...g, length: val } : g)
                                }));
                              }
                            }}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-sm text-center transition-all"
                            placeholder="0.6"
                          />
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-600 block mb-1 text-center">العرض (م)</span>
                          <input 
                            type="text"
                            inputMode="decimal"
                            value={group.width}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\\d*\\.?\\d*$/.test(val)) {
                                setState(prev => ({
                                  ...prev,
                                  batteryGroups: prev.batteryGroups.map(g => g.id === group.id ? { ...g, width: val } : g)
                                }));
                              }
                            }}
                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-2 py-3 focus:border-blue-600 focus:outline-none font-black text-white text-sm text-center transition-all"
                            placeholder="0.5"
                          />
                        </div>

                        {/* Tiers */}
                        <div className="col-span-2 space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-slate-600 uppercase">عدد الأدوار: {group.tiers}</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-right">طوابق البطارية</span>
                          </div>
                          <div className="flex items-center gap-4 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
                            <input 
                              type="range"
                              min="1"
                              max="6"
                              value={group.tiers}
                              onChange={e => {
                                const tiers = parseInt(e.target.value);
                                setState(prev => ({
                                  ...prev,
                                  batteryGroups: prev.batteryGroups.map(g => g.id === group.id ? { ...g, tiers } : g)
                                }));
                              }}
                              style={{
                                background: `linear-gradient(to left, #9333ea 0%, #9333ea ${(((Number(group.tiers)) - 1) / (6 - 1)) * 100}%, #1e293b ${(((Number(group.tiers)) - 1) / (6 - 1)) * 100}%, #1e293b 100%)`
                              }}
                              className="flex-1 appearance-none h-1.5 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}"""

new_content = content[:idx] + replacement + content[end_idx + len(end_marker):]

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Restoration script executed successfully!")
