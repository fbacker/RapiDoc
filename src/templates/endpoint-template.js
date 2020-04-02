import { html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html';
import marked from 'marked';
import '@/components/api-request';
import '@/components/api-response';
import { callbackTemplate } from '@/templates/expanded-endpoint-template';

/* eslint-disable indent */
function toggleExpand(path) {
  const newHash = `#${path.method}-${path.path.replace(/[\s#:?&=]/g, '-')}`;
  const currentHash = window.location.hash;
  if (currentHash !== newHash) {
    window.history.replaceState(null, null, `${window.location.href.split('#')[0]}${newHash}`);
  }
  if (path.expanded) {
    path.expanded = false; // collapse
  } else {
    path.expanded = true; // Expand
  }
  this.requestUpdate();
}

function endpointHeadTemplate(path) {
  return html`
  <div @click="${(e) => { toggleExpand.call(this, path, e); }}" class='endpoint-head ${path.method} ${path.deprecated ? 'deprecated' : ''} ${path.expanded ? 'expanded' : 'collapsed'}'>
    <div class="method ${path.method} ${path.deprecated ? 'deprecated' : ''}"> ${path.method} </div> 
    <div class="path ${path.deprecated ? 'deprecated' : ''}"> 
      ${path.path} 
    </div>
    ${path.deprecated
      ? html`
        <span style="font-size:var(--font-size-small); text-transform:uppercase; font-weight:bold; color:var(--red); margin:2px 0 0 5px;"> 
          deprecated 
        </span>`
      : ''
    }
    <div class="only-large-screen" style="min-width:60px; flex:1"></div>
    <div class="m-markdown-small descr"> ${unsafeHTML(marked(path.summary || ''))} </div>
  </div>
  `;
}

function endpointBodyTemplate(path, allowAuthenticationSeperatedCalls, showOperationRequirements) {
  let accept = '';
  for (const respStatus in path.responses) {
    for (const acceptContentType in (path.responses[respStatus].content)) {
      accept = `${accept + acceptContentType}, `;
    }
  }
  accept = accept.replace(/,\s*$/, ''); // remove trailing comma
  const nonEmptyApiKeys = this.resolvedSpec.securitySchemes.filter((v) => (v.finalKeyValue)) || [];
  return html`
  <div class='endpoint-body ${path.method} ${path.deprecated ? 'deprecated' : ''}'>
    <div class="summary">
      ${path.summary && path.summary !== path.description ? html`<div class="title">${path.summary}</div>` : ''}
      ${path.description ? html`<div class="m-markdown"> ${unsafeHTML(marked(path.description))}</div>` : ''}
    </div>  
    <div class='req-resp-container'> 
      <api-request  class="request"  
        method = "${path.method}", 
        path = "${path.path}" 
        .parameters = "${path.parameters}"
        .request_body = "${path.requestBody}"
        .api_keys = "${nonEmptyApiKeys}"
        .security = "${path.security}" 
        .servers = "${path.servers}" 
        server-url = "${path.servers && path.servers.length > 0 ? path.servers[0].url : this.selectedServer.computedUrl}" 
        active-schema-tab = "${this.defaultSchemaTab}" 
        allow-authentication-separated-calls = "${allowAuthenticationSeperatedCalls}"
        allow-try = "${this.allowTry}"
        accept = "${accept}"
        render-style="${this.renderStyle}" 
        schema-style = "${this.schemaStyle}" 
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-description-expanded = "${this.schemaDescriptionExpanded}"
        show-operation-requirements = "${showOperationRequirements}"
      > 
        ${path.callbacks ? callbackTemplate.call(this, path.callbacks) : ''}
      </api-request>
      <api-response  
        class="response" 
        .responses="${path.responses}"
        active-schema-tab = "${this.defaultSchemaTab}" 
        render-style="${this.renderStyle}" 
        schema-style="${this.schemaStyle}"
        schema-expand-level = "${this.schemaExpandLevel}"
        schema-description-expanded = "${this.schemaDescriptionExpanded}"
      > </api-response>
    </div>
  </div>`;
}

export default function endpointTemplate(allowAuthenticationSeperatedCalls, showOperationRequirements) {
  return html`
    ${this.resolvedSpec.tags.map((tag) => html`
    <div class='regular-font section-gap'> 
      <div id='${tag.name.replace(/[\s#:?&=]/g, '-')}' class="sub-title tag">${tag.name}</div>
      <div class="regular-font-size">
        ${tag.description
          ? html`
            ${unsafeHTML(`<div class='m-markdown regular-font'>${marked(tag.description)}</div>`)}`
          : ''
        }
      </div>
    </div>
    ${tag.paths.filter((v) => {
      if (this.matchPaths) {
        return `${v.method} ${v.path}`.includes(this.matchPaths);
      }
      return true;
    }).map((path) => html`
      <div id='${path.method}-${path.path.replace(/[\s#:?&=]/g, '-')}' class='m-endpoint regular-font ${path.method} ${path.expanded ? 'expanded' : 'collapsed'}'>
        ${endpointHeadTemplate.call(this, path)}      
        ${path.expanded ? endpointBodyTemplate.call(this, path, allowAuthenticationSeperatedCalls, showOperationRequirements) : ''}
      </div>
    `)
    }`)
  }`;
}
/* eslint-enable indent */
