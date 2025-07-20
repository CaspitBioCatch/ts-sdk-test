import { assert, expect } from 'chai';
import { ElementStrengthenInstance, ElementStrengthen } from '../../../../src/main/technicalServices/ElementStrengthen';
import { UniqueIDConfiguration } from '../../../../src/main/technicalServices/UniqueIDConfiguration';
import Log from '../../../../src/main/technicalServices/log/Logger';
import sinon from 'sinon';

describe('ElementStrengthen', () => {
  let sandbox;
  let logInfoSpy;
  let elementStrengthen;

  before(() => {
    logInfoSpy = sinon.spy(Log, 'info');
  });

  after(() => {
    logInfoSpy.restore();
  });

  beforeEach(() => {
    // clean DOM each time
    document.body.innerHTML = '';
    sandbox = sinon.createSandbox();
    elementStrengthen = new ElementStrengthen();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('isElementVisible', () => {
    it('returns true for a visible element', () => {
      const el = document.createElement('div');
      el.style.width = '10px';
      el.style.height = '5px';
      document.body.appendChild(el);
      assert.isTrue(elementStrengthen.isElementVisible(el));
    });

    it('returns false when display:none', () => {
      const el = document.createElement('div');
      el.style.width = '10px';
      el.style.height = '5px';
      el.style.display = 'none';
      document.body.appendChild(el);
      assert.isFalse(elementStrengthen.isElementVisible(el));
    });

    it('returns false when visibility:hidden', () => {
      const el = document.createElement('div');
      el.style.width = '10px';
      el.style.height = '5px';
      el.style.visibility = 'hidden';
      document.body.appendChild(el);
      assert.isFalse(elementStrengthen.isElementVisible(el));
    });

    it('returns false when opacity:0', () => {
      const el = document.createElement('div');
      el.style.width = '10px';
      el.style.height = '5px';
      el.style.opacity = '0';
      document.body.appendChild(el);
      assert.isFalse(elementStrengthen.isElementVisible(el));
    });

    it('returns false when hidden attribute present', () => {
      const el = document.createElement('div');
      el.setAttribute('hidden', '');
      document.body.appendChild(el);
      assert.isFalse(elementStrengthen.isElementVisible(el));
    });
  });

  describe('isInExcludedArea', () => {
    ['footer', 'header', 'nav'].forEach(tag => {
      it(`returns true if inside <${tag}>`, () => {
        const parent = document.createElement(tag);
        const child = document.createElement('span');
        parent.appendChild(child);
        document.body.appendChild(parent);
        assert.isTrue(elementStrengthen.isInExcludedArea(child));
      });
    });

    it('returns false if not inside excluded tags', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      assert.isFalse(elementStrengthen.isInExcludedArea(el));
    });
  });

  describe('isContainer', () => {
    it('recognizes by tagName', () => {
      ['main', 'article', 'aside', 'div'].forEach(tag => {
        const el = document.createElement(tag);
        assert.isTrue(elementStrengthen.isContainer(el));
      });
    });

    it('recognizes by classList', () => {
      const el = document.createElement('section');
      el.className = 'container wrapper section content main-content main_content';
      assert.isTrue(elementStrengthen.isContainer(el));
    });

    it('recognizes by role="region"', () => {
      const el = document.createElement('div');
      el.setAttribute('role', 'region');
      assert.isTrue(elementStrengthen.isContainer(el));
    });

    it('recognizes by aria-label', () => {
      const el = document.createElement('div');
      el.setAttribute('aria-label', 'foo');
      assert.isTrue(elementStrengthen.isContainer(el));
    });

    it('recognizes by data-* attributes', () => {
      const el = document.createElement('div');
      el.setAttribute('data-test', '1');
      assert.isTrue(elementStrengthen.isContainer(el));
    });

    it('returns false otherwise', () => {
      const el = document.createElement('span');
      assert.isFalse(elementStrengthen.isContainer(el));
    });
  });

  describe('isCustomElement', () => {
    it('true when localName contains "-"', () => {
      const el = document.createElement('my-widget');
      assert.isTrue(elementStrengthen.isCustomElement(el));
    });
    it('false otherwise', () => {
      const el = document.createElement('div');
      assert.isFalse(elementStrengthen.isCustomElement(el));
    });
    it('false if localName not string', () => {
      // @ts-ignore
      const fake = { localName: 123 };
      assert.isFalse(elementStrengthen.isCustomElement(fake));
    });
  });

  describe('calculateScore', () => {
    it('weights + username id bonus + text type', () => {
      const el = { tagName: 'INPUT', id: 'username1', name: '', type: 'text' };
      const score = elementStrengthen.calculateScore(el);
      // input weight 5 + id-bonus 20 + text-bonus 10 = 35
      assert.equal(score, 35);
    });
    it('weights + username name bonus', () => {
      const el = { tagName: 'INPUT', id: '', name: 'username2', type: 'text' };
      const score = elementStrengthen.calculateScore(el);
      assert.equal(score, 25); //5+10+10
    });
    it('no bonus for other names', () => {
      const el = { tagName: 'INPUT', id: 'foo', name: 'bar', type: 'text' };
      assert.equal(elementStrengthen.calculateScore(el), 15); //5+0+10
    });
    it('password type has no text bonus', () => {
      const el = { tagName: 'INPUT', id: 'foo', name: 'bar', type: 'password' };
      assert.equal(elementStrengthen.calculateScore(el), 5);
    });
    it('fieldset tag weight', () => {
      const el = { tagName: 'FIELDSET', id: 'username', name: '', type: 'text' };
      assert.equal(elementStrengthen.calculateScore(el), 34); //4+20+10
    });
    it('unknown tag → NaN', () => {
      const el = { tagName: 'H1', id: 'username', name: '', type: 'text' };
      assert.isNaN(elementStrengthen.calculateScore(el));
    });
  });

  describe('findInteractiveArea', () => {
    it('picks parent with highest score', () => {
      // Build two sections: one with username <input>, one with label only
      const sec1 = document.createElement('section');
      sec1.id = 'A';
      const inp = document.createElement('input');
      inp.id = 'username';
      inp.type = 'text';
      sec1.appendChild(inp);

      const sec2 = document.createElement('section');
      sec2.id = 'B';
      const lbl = document.createElement('label');
      sec2.appendChild(lbl);

      document.body.appendChild(sec1);
      document.body.appendChild(sec2);

      const winner = elementStrengthen.findInteractiveArea(document);
      assert.equal(winner.id, 'A');
    });

    it('returns undefined when none visible', () => {
      sandbox.stub(elementStrengthen, 'isElementVisible').returns(false);
      const result = elementStrengthen.findInteractiveArea(document);
      assert.isUndefined(result);
    });
  });

  describe('findPotentialContainer', () => {
    it('returns nearest container ancestor', () => {
      const cont = document.createElement('div');
      cont.className = 'container';
      const inner = document.createElement('input');
      cont.appendChild(inner);
      document.body.appendChild(cont);

      const result = elementStrengthen.findPotentialContainer(inner);
      assert.strictEqual(result, cont);
    });
    it('returns null when none found', () => {
      const el = document.createElement('span');
      document.body.appendChild(el);
      assert.isNull(elementStrengthen.findPotentialContainer(el));
    });
  });

  describe('interactiveContainer', () => {
    it('returns container of interactive area', () => {
      const cont = document.createElement('div');
      cont.className = 'container';
      const inp = document.createElement('input');
      cont.appendChild(inp);
      document.body.appendChild(cont);

      sandbox.stub(elementStrengthen, 'findInteractiveArea').returns(inp);
      sandbox.stub(elementStrengthen, 'findPotentialContainer').returns(cont);

      const result = elementStrengthen.interactiveContainer();
      assert.strictEqual(result, cont);
    });
    it('logs if no interactive area', () => {
      sandbox.stub(elementStrengthen, 'findInteractiveArea').returns(null);
      const result = elementStrengthen.interactiveContainer();
      assert.isUndefined(result);
      assert.isTrue(logInfoSpy.calledOnce);
    });
  });

  describe('getUniqueElementId', () => {

    const cfg = UniqueIDConfiguration.parse({
      componentsFormat: "{tagName}_{index}_{id}_{className}_{ariaLabel}_{containerInfo}_{hierarchyPath}",
      hierarchyFormat: "{tagName}_{index}",
      enabledTags: ["div", "span"]
    });

    it('returns "" if no element or config', () => {
      assert.equal(elementStrengthen.getUniqueElementId(null, null), '');
    });

    it('returns -1 if tag not enabled', () => {
      const el = document.createElement('p');
      document.body.appendChild(el);
      assert.equal(elementStrengthen.getUniqueElementId(el, cfg), '-1');
    });

    it('builds ID from placeholders', () => {
      const el = document.createElement('div');
      el.id = 'foo';
      document.body.appendChild(el);
      const id = elementStrengthen.getUniqueElementId(el, cfg);
      // tagName div, index 0 among siblings, id 'foo'
      assert.equal(id, 'div_[0]_foo');
    });

    it('respects maxDepth for deep nodes', () => {
      const root = document.createElement('div');
      let curr = root;
      for (let i = 0; i < cfg.hierarchyFormat.length + 5; i++) {
        const child = document.createElement('div');
        curr.appendChild(child);
        curr = child;
      }
      document.body.appendChild(root);
      const deep = curr;
      const out = elementStrengthen.getUniqueElementId(deep, cfg, 5);
      // should be shorter than full depth
      expect(out.length).to.be.below(200);
    });
  });

  describe('getUniqueElementXpath', () => {
    it('builds simple xpath for element with id', () => {
      const el = document.createElement('div');
      el.id = 'bar';
      document.body.appendChild(el);
      const xp = elementStrengthen.getUniqueElementXpath(el);
      assert.match(xp, /div#bar$/);
    });

    it('uses sibling index when no id', () => {
      const parent = document.createElement('div');
      const a = document.createElement('span');
      const b = document.createElement('span');
      parent.appendChild(a);
      parent.appendChild(b);
      document.body.appendChild(parent);
      const xp = elementStrengthen.getUniqueElementXpath(b);
      assert.match(xp, /span:2$/);
    });

    describe('shadow DOM support', () => {
      let host, root, inner, slot;
      beforeEach(() => {
        host = document.createElement('div');
        root = host.attachShadow({ mode: 'open' });
        inner = document.createElement('span');
        root.appendChild(inner);
        slot = document.createElement('slot');
        root.appendChild(slot);
        document.body.appendChild(host);
      });
      afterEach(() => {
        document.body.removeChild(host);
      });

      it('includes host in path', () => {
        const xp = elementStrengthen.getUniqueElementXpath(inner);
        assert.match(xp, /div/);
        assert.match(xp, /span/);
      });
      it('handles a slotted <slot> node', () => {
        const xp = elementStrengthen.getUniqueElementXpath(slot);
        assert.match(xp, /slot/);
        assert.match(xp, /div/);
      });
    });
  });
});
