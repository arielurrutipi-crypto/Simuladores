(() => {
  // la instalación 302_A BG-046-PL-M-01: 4385 mm between collector axes; 4580 mm overall dimension.
  // One scene unit = 438.5 mm. Key elevation/branch spacings from drawing; local equipment stations remain approximate.
  const common={inlet:-4.60,filter:-4.00,piIn:-2.24,ssv:-1.73,monitor:-1.45,monitorBody:-1.60,piMid:-.99,active:-.37,expansion:.55,manifold:2.04,returnTap:2.37,purge:2.70,gauge:3.04,relief:3.37,outlet:4.45};
  const branches={A:{...common,z:-1000/438.5,side:-1},C:{...common,z:1200/438.5,side:1},B:{...common,inlet:-4.30,filter:-2.90,piIn:-2.28,ssv:-1.60,monitor:null,active:-.30,expansion:.15,manifold:null,returnTap:null,signalTap:1.95,ssvTap:2.25,purge:3.00,gauge:2.60,relief:3.37,outlet:4.45,z:0,side:1}};
  globalThis.ERP25Layout={y:1000/438.5,mmPerUnit:438.5,site:"la instalación",drawing:"302_A BG-046-PL-M-01",branches};
})();
