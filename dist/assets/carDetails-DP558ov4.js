import{t as e}from"./style-CVmKxC4q.js";e((()=>{document.addEventListener(`DOMContentLoaded`,async()=>{let e=new URLSearchParams(window.location.search).get(`id`),t=document.getElementById(`details-container`);if(!e){t.innerHTML=`<div style="padding: 10rem 0; text-align: center;"><h2>Vehicle not found</h2><a href="./index.html" class="btn outline" style="margin-top: 2rem;">Return to Inventory</a></div>`;return}try{let n=await fetch(`https://hellride.onrender.com/api/inventory/${e}`);if(!n.ok)throw Error(`Failed to fetch`);let r=await n.json(),i=r.images?r.images:r.image?[r.image]:[],a=i.length>0?i[0]:``,o=e=>e&&e.toLowerCase().match(/\.(mp4|webm|ogg)$/i),s=(e,t=!1,n=0)=>{let r=e;return(r.startsWith(`./`)||r.startsWith(`/`))&&(r=`https://hellride.onrender.com`+r.replace(/^\.\//,`/`)),o(r)?t?`<video src="${r}" class="${n===0?`active`:``}" onclick="changeMainImage('${r}', this, true)" muted playsinline></video>`:`<video id="main-display-img" src="${r}" autoplay loop muted playsinline></video>`:t?`<img src="${r}" class="${n===0?`active`:``}" onclick="changeMainImage('${r}', this, false)">`:`<img id="main-display-img" src="${r}" alt="Vehicle Media">`},c=``;i.length>1&&(c=`<div class="gallery-thumbs">`,i.forEach((e,t)=>{c+=s(e,!0,t)}),c+=`</div>`),t.innerHTML=`
            <a href="./index.html#inventory" style="color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem;">
              <i data-lucide="arrow-left"></i> Back to Inventory
            </a>
            <div class="details-grid">
              <!-- Left: Gallery -->
              <div class="gallery-wrapper">
                <div class="gallery-main" id="main-gallery-container">
                  ${s(a)}
                </div>
                ${c}
              </div>

              <!-- Right: Info -->
              <div class="details-info">
                <span class="brand-badge">${r.brand||`HellRide`}</span>
                <h1>${r.name}</h1>
                <div class="details-price">${new Intl.NumberFormat(`ru-RU`).format(r.price)} ₽</div>
                
                <div class="specs-grid">
                  <div class="spec-item">
                    <i data-lucide="zap" style="width:24px; height:24px;"></i>
                    <div>
                      <small>Power</small>
                      <strong>${r.hp?r.hp+` HP`:`N/A`}</strong>
                    </div>
                  </div>
                  <div class="spec-item">
                    <i data-lucide="gauge" style="width:24px; height:24px;"></i>
                    <div>
                      <small>Mileage</small>
                      <strong>${r.km?r.km.toLocaleString(`ru-RU`)+` KM`:`New`}</strong>
                    </div>
                  </div>
                </div>

                <div class="details-desc">
                  ${r.description||`No detailed description available for this vehicle.`}
                </div>

                <button class="btn primary full glow" onclick="window.location.href='./test-drive.html'" style="padding: 1.25rem; font-size: 1.125rem;">
                  Book Test Drive
                </button>
              </div>
            </div>
          `,lucide.createIcons()}catch(e){console.error(e),t.innerHTML=`<div style="padding: 10rem 0; text-align: center;"><h2>Error loading vehicle</h2><p style="color:var(--text-muted);">Please check your connection and try again.</p><a href="./index.html" class="btn outline" style="margin-top: 2rem;">Return to Inventory</a></div>`}}),window.changeMainImage=function(e,t,n=!1){let r=document.getElementById(`main-gallery-container`);n?r.innerHTML=`<video id="main-display-img" src="${e}" autoplay loop muted playsinline></video>`:r.innerHTML=`<img id="main-display-img" src="${e}" alt="Vehicle Media">`,document.querySelectorAll(`.gallery-thumbs img, .gallery-thumbs video`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`)}}))();