const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function match({ label, ariaLabel, contextText, previous, ...attributes } = {}) {
  const context = vm.createContext({
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 },
    document: { querySelector: () => label ? { textContent: label } : null },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/matcher.js'), 'utf8'), context);
  const element = {
    id: '', name: '', type: 'text', autocomplete: '',
    ...attributes,
    getAttribute: name => name === 'aria-label' ? ariaLabel : null,
    closest: () => null,
    previousElementSibling: previous || null,
    parentElement: contextText ? { childNodes: [{ nodeType: 3, textContent: contextText }] } : null,
  };
  return context.matchFieldByKeywords(element);
}

test('telephone type cannot be outscored by nearby city labels', () => {
  const result = match({ type: 'tel', contextText: 'City Town Ort' });
  assert.equal(result?.profileKey, 'personal.phone');
  assert.equal(result.confidence, 'high');
  // This is the same profile lookup used by content.js before filling.
  const profile = { 'personal.phone': '+49 123 456789', 'address.city': 'Hamburg' };
  assert.equal(profile[result.profileKey], '+49 123 456789');
});

test('a text telephone field uses its own label before shared city context', () => {
  assert.equal(match({ id: 'field42', label: 'Phone *', contextText: 'City Town Ort' })?.profileKey, 'personal.phone');
  assert.equal(match({ name: 'phone', previous: { tagName: 'DIV', textContent: 'City Town Ort' } })?.profileKey, 'personal.phone');
  assert.equal(match({ ariaLabel: '电话', contextText: '城市 City Town Ort' })?.profileKey, 'personal.phone');
});

test('short city keyword ort does not match parts of unrelated words', () => {
  for (const name of ['support', 'transport', 'passport', 'sortOrder']) {
    assert.equal(match({ name }), null, name);
  }
  assert.equal(match({ name: 'supportPhone' })?.profileKey, 'personal.phone');
  assert.equal(match({ name: 'portfolio' })?.profileKey, 'links.portfolio');
});

test('autocomplete and input types work without labels and override surrounding keywords', () => {
  for (const autocomplete of ['tel', 'tel-national', 'section-contact shipping home tel', ' TEL ']) {
    const result = match({ autocomplete, contextText: 'City Town Ort' });
    assert.equal(result?.profileKey, 'personal.phone', autocomplete);
    assert.equal(result.confidence, 'high');
  }
  assert.equal(match({ type: 'tel' })?.profileKey, 'personal.phone');
  assert.equal(match({ type: 'email' })?.profileKey, 'personal.email');
  assert.equal(match({ autocomplete: 'address-level2', contextText: 'Telephone Mobile Phone' })?.profileKey, 'address.city');
});

test('city and telephone labels still match in English, German and Chinese', () => {
  for (const label of ['City', 'Town', 'Ort', 'Stadt', '城市']) {
    assert.equal(match({ ariaLabel: label })?.profileKey, 'address.city', label);
  }
  for (const label of ['Phone', 'Telephone', 'Mobile', 'Tel.', 'Telefonnummer', 'Rufnummer', '电话', '手机号码']) {
    assert.equal(match({ ariaLabel: label })?.profileKey, 'personal.phone', label);
  }
  assert.equal(match({ name: 'firstName.value' })?.profileKey, 'personal.firstName');
  assert.equal(match({ name: 'address[city]' })?.profileKey, 'address.city');
});

test('local plain-text context remains a fallback for otherwise unidentified fields', () => {
  assert.equal(match({ contextText: 'Phone number' })?.profileKey, 'personal.phone');
  assert.equal(match({ previous: { tagName: 'SPAN', textContent: 'City' } })?.profileKey, 'address.city');
  assert.equal(match(), null);
});
