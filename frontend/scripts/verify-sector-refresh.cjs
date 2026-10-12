const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.AMUD_PLAYWRIGHT_PATH || 'playwright');
const base = process.env.UI_QA_URL || 'http://localhost:3011';
const out = path.resolve('artifacts/ui-refresh');
const routes = ['chauffeur-allemagne','logistique-allemagne','hotellerie-allemagne','sante-allemagne','btp-allemagne','notre-entreprise/startup'];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers:'block' });
  await context.addInitScript(()=>localStorage.setItem('amud-analytics-consent-v1','denied'));
  const page = await context.newPage();
  const errors = [], checks = [], links = new Set();
  page.on('pageerror', e => errors.push(e.message));
  page.setDefaultTimeout(25000);
  for (const width of [390,820,1440,320]) {
    await page.setViewportSize({ width, height: 950 });
    for (const route of routes) {
      const response = await page.goto(`${base}/${route}`, { waitUntil: 'networkidle', timeout: 120000 }).catch(()=>page.goto(`${base}/${route}`, { waitUntil:'networkidle', timeout:120000 }));
      const reject = page.getByRole('button',{name:'Tout refuser',exact:true}); if(await reject.isVisible()) await reject.click();
      await page.locator('h1').waitFor();
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 650) { window.scrollTo(0,y); await new Promise(r => setTimeout(r,90)); }
        await Promise.all([...document.images].map(img => img.decode().catch(()=>{})));
      });
      const result = await page.evaluate(() => {
        const root = document.querySelector('.sector-page,.startup-editorial');
        const overflow = [...document.querySelectorAll('main *,footer *')].filter(e => {
          const r=e.getBoundingClientRect();const s=getComputedStyle(e);
          return r.width>0 && s.visibility!=='hidden' && s.display!=='none' && (r.right>innerWidth+1 || r.left < -1);
        }).map(e=>`${e.tagName}.${e.className}`).slice(0,10);
        return { h1: document.querySelectorAll('h1').length, overflow, bodyOverflow:document.documentElement.scrollWidth>innerWidth+1,
          missingImages:[...root.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth||i.currentSrc.startsWith('data:image')).map(i=>i.getAttribute('src')),
          missingAlt:[...root.querySelectorAll('img')].filter(i=>!i.alt).length,
          closedFooter:[...document.querySelectorAll('.premium-footer-disclosure')].every(d=>!d.open),
          footerColor:getComputedStyle(document.querySelector('footer')).backgroundColor,
          links:[...document.querySelectorAll('main a,footer a')].map(a=>a.getAttribute('href')).filter(h=>h?.startsWith('/')),
        };
      });
      result.links.forEach(h=>links.add(h)); delete result.links;
      if(width!==320){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(out,`${route.replaceAll('/','-')}-${width}.png`),fullPage:true});}
      checks.push({ route,width,status:response.status(),...result });
      fs.writeFileSync(path.join(out,'checks-partial.json'),JSON.stringify(checks,null,2));
      console.log(JSON.stringify(checks.at(-1)));
    }
  }
  const interactions=[];
  for(const width of [390,820,1024,1440]){
    await page.setViewportSize({width,height:950});
    await page.goto(`${base}/chauffeur-allemagne`,{waitUntil:'networkidle'});
    const disclosures=page.locator('.premium-footer-disclosure');
    if(width<=1100){
      for(let i=0;i<4;i++){
        const d=disclosures.nth(i);const summary=d.locator('summary');await summary.focus();await page.keyboard.press('Enter');
        if(!await d.evaluate(e=>e.open))throw Error('Footer keyboard open failed');
        await d.locator('a').first().waitFor({state:'visible'});
        await summary.focus();await page.keyboard.press('Space');
        if(await d.evaluate(e=>e.open))throw Error('Footer keyboard close failed');
      }
    }else if(!await page.locator('.premium-footer-desktop').first().isVisible())throw Error('Desktop columns hidden');
    interactions.push({width,footer:'pass'});
    await page.locator('footer').screenshot({path:path.join(out,`footer-${width}.png`)});
  }
  const locales=[];
  for(const lang of ['ar','de','en']){
    await page.evaluate(lang=>localStorage.setItem('as_language',JSON.stringify(lang)),lang);
    await page.setViewportSize({width:390,height:950});
    await page.goto(`${base}/notre-entreprise/startup`,{waitUntil:'networkidle'});
    await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=650){scrollTo(0,y);await new Promise(r=>setTimeout(r,90));}});
    locales.push({lang,...await page.evaluate(()=>({dir:document.querySelector('.startup-editorial').dir,overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length}))});
    await page.screenshot({path:path.join(out,`startup-${lang}-390.png`),fullPage:true});
  }
  await page.evaluate(()=>{localStorage.setItem('as_theme','"dark"');localStorage.setItem('as_language','"fr"');});
  for(const route of ['sante-allemagne','notre-entreprise/startup']){
    await page.goto(`${base}/${route}`,{waitUntil:'networkidle'});
    await page.screenshot({path:path.join(out,`dark-${route.replaceAll('/','-')}.png`),fullPage:true});
  }
  const linkChecks=[];
  for(const href of links){
    const res=await context.request.get(`${base}${href.split('#')[0]}`,{timeout:120000});
    linkChecks.push({href,status:res.status()});
  }
  const report={checks,interactions,locales,errors,linkChecks};
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));
  await browser.close();
  const failures=checks.filter(c=>c.status!==200||c.h1!==1||c.bodyOverflow||c.missingImages.length||c.missingAlt||c.overflow.length||!c.closedFooter);
  console.log(JSON.stringify({failures,errors,badLinks:linkChecks.filter(l=>l.status>=400),locales}));
  if(failures.length||errors.length||linkChecks.some(l=>l.status>=400)||locales.some(l=>l.overflow))process.exitCode=1;
})();
