export class WebCompDemo extends HTMLElement {
    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: 'open' });
        this._shadowRoot.innerHTML = this.setupHTML();
    }

    /**
     * Called upon insertion of this element into the DOM tree
     */
    connectedCallback() {
        // M.AutoInit(this._shadowRoot);
        M.updateTextFields(this._shadowRoot);
        const elems = this._shadowRoot.querySelectorAll('.datepicker');
        const datePickerContanier = document.querySelector('.renderCalendar');
        /* eslint no-console: "off" */
        M.Datepicker.init(elems, { 'container': datePickerContanier });

        const selectElems = this._shadowRoot.querySelector('#selectionDemo select');
        M.FormSelect.init(selectElems, {});
        // window.cdApi.subscribeCustomElement(this._shadowRoot);
        // Nobody promise that this method will invoke our API upon re-mounting this element
        // window.cdApi.client.submitCustomElement(this._shadowRoot);
    }

    setupHTML() {
        return `
            <!--Import Google Icon Font-->
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <link type="text/css" rel="stylesheet" href="materialize/css/materialize.css"  media="screen,projection"/>          
            <form>
                <div class="row">
                    <p>Web Component Content &lt;custom-shadow-element&gt;</p>
                    <div class="input-field col s6">
                        <input placeholder="First Name Placeholder" id="wc_first_name" type="text" class="validate">
                        <label for="wc_first_name" class="active">First Name</label>
                    </div>
                    <div class="input-field col s6">
                        <input id="wc_last_name" type="text" class="validate">
                        <label for="wc_last_name" class="active">Last Name</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input disabled value="I am not editable" id="wc_disabled" type="text" class="validate">
                        <label for="wc_disabled" class="active">Disabled</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input id="wc_password" type="password" class="validate">
                        <label for="wc_password" class="active">Password</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input id="wc_email" type="email" class="validate">
                        <label for="wc_email" class="active">Email</label>
                    </div>
                </div>
                <input type="text" class="datepicker" value="Date">
                <div class="row">
                 <div id="selectionDemo" class="input-field col s12">
                    <select class="browser-default">
                      <option value="" disabled selected>Choose your option</option>
                      <option value="1">Option 1</option>
                      <option value="2">Option 2</option>
                      <option value="3">Option 3</option>
                    </select>
                  </div>                
                </div>                
                <p>
                  <label>
                    <input name="group1" type="radio" checked />
                    <span>Red</span>
                  </label>
                </p>
                <p>
                  <label>
                    <input name="group1" type="radio" />
                    <span>Yellow</span>
                  </label>
                </p>
                <p>
                  <label>
                    <input name="group1" type="radio"  />
                    <span>Green</span>
                  </label>
                </p>
                <p>
                  <label>
                    <input name="group1" type="radio" disabled="disabled" />
                    <span>Brown</span>
                  </label>
                </p>               
                <p>
                  <label>
                    <input type="checkbox" />
                    <span>Red</span>
                  </label>
                </p>
                <p>
                  <label>
                    <input type="checkbox" checked="checked" />
                    <span>Yellow</span>
                  </label>
                </p>
                <p>
                  <label>
                    <input type="checkbox" />
                    <span>Green</span>
                  </label>
                </p>
                <p>
                  <label>
                    <input type="checkbox" />
                    <span>Blue</span>
                  </label>
                </p>
                 <div class="row">
                    <button class="btn waves-effect waves-light" type="button" name="action">Submit
                        <i class="material-icons right">send</i>
                    </button>
                </div>
            </form>
        `;
    }

    static get observedAttributes() {
        return ['formSubmitted'];
    }

    get formSubmitted() {
        return this.hasAttribute('formSubmitted');
    }

    set formSubmitted(val) {
        if (val) {
            this.setAttribute('formSubmitted', true);
        }
    }
    //
    // attributeChangedCallback(attr, oldVal, newVal) {
    //     switch(attr) {
    //         case 'foo':
    //         // do something with 'foo' attribute
    //         case 'bar':
    //         // do something with 'bar' attribute
    //     }
    // }
}
