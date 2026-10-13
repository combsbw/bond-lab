/* The challenge engine: how a question is stored, asked, marked and explained.

   The questions themselves live in the bank files — js/quiz.js for Bond Lab,
   js/life/quiz.js for the Life Lab — and each one calls BL.quizAdd as it
   loads. Both labs share this file, this storage and this card, so a question
   behaves identically whichever lab it sits in.

   What makes a question worth asking is in the bank files' own headers. The
   short version: all four options are mechanisms, in the same voice, and no
   option can be picked out by being longest or most technical. */
(function () {
  'use strict';
  const { h } = BL;

  /* Banks register themselves as they load, the same way instruments do. */
  const BANK = (BL.quizBank = []);
  BL.quizAdd = (qs) => { BANK.push(...qs); };

  const KEY = 'quiz';
  const saved = () => BL.store.get(KEY, {}) || {};
  const mark = (id, ok) => { const s = saved(); s[id] = ok ? 'right' : 'wrong'; BL.store.set(KEY, s); };

  BL.quizFor = (opts) => BANK.filter((q) => (opts.sim ? q.sim === opts.sim : q.field === opts.field));
  BL.quizScore = (field) => {
    const s = saved();
    const qs = BANK.filter((q) => q.field === field);
    return { done: qs.filter((q) => s[q.id] === 'right').length, total: qs.length };
  };

  /* Forgetting the answers, for one lab's fields or for all of them. An
     answered challenge is spent — you cannot un-know which option was right —
     so clearing the marks is the only way to hand it to somebody fresh. */
  BL.quizReset = function (fields) {
    const s = saved();
    BANK.forEach((q) => { if (!fields || fields.indexOf(q.field) >= 0) delete s[q.id]; });
    BL.store.set(KEY, s);
  };
  BL.quizAnswered = function (fields) {
    const s = saved();
    return BANK.filter((q) => (!fields || fields.indexOf(q.field) >= 0) && s[q.id]).length;
  };

  /* One challenge, as a card. Answer it, then go and check. */
  function card(q, opts) {
    const state = saved()[q.id];
    const box = h('li', { class: 'ch' + (state === 'right' ? ' right' : '') });
    const ask = h('p', { class: 'ch-ask' }, q.ask);
    const list = h('div', { class: 'ch-choices', role: 'group', 'aria-label': 'Choose an answer' });
    const result = h('div', { class: 'ch-result', hidden: true });

    // shuffled, so the answer is never in the same slot twice
    const order = q.choices.map((c, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }

    let answered = false;
    const btns = order.map((i) => {
      const c = q.choices[i];
      const b = h('button', { type: 'button', class: 'ch-choice' }, h('span', { class: 'ch-t' }, c.t));
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        /* Every option explains itself afterwards, not just the one that was
           picked. The whole point of a good wrong answer is that finding out
           why it fails is worth more than being told the right one. */
        btns.forEach((o, k) => {
          const cc = q.choices[order[k]];
          o.classList.add(cc.ok ? 'is-right' : 'is-wrong');
          o.disabled = true;
          if (cc.why) o.appendChild(h('span', { class: 'ch-why' }, cc.why));
        });
        b.classList.add('picked');
        const right = !!c.ok;
        mark(q.id, right);
        if (right) box.classList.add('right');
        result.hidden = false;
        result.textContent = '';
        result.append(
          h('p', { class: 'ch-verdict ' + (right ? 'yes' : 'no') }, right ? 'Yes.' : 'Not that one.'),
          h('p', {}, q.after),
          h('p', { class: 'ch-try' },
            h('span', {}, q.tryIt + ' '),
            h('a', { class: 'ch-go', href: '#/' + q.sim }, 'Go and check →')));
        if (opts && opts.onanswer) opts.onanswer();
      });
      list.appendChild(b);
      return b;
    });

    box.append(ask, list, result);
    if (state) {
      box.append(h('p', { class: 'ch-seen' }, state === 'right' ? 'You have answered this one.' : 'You have had a go at this one.'));
    }
    return box;
  }

  /* A set of challenges. opts: {field} or {sim}, plus an optional title. */
  BL.challenges = function (host, opts) {
    const qs = BL.quizFor(opts);
    if (!qs.length) return null;
    const list = h('ul', { class: 'ch-list' }, qs.map((q) => card(q, opts)));
    const sec = h('section', { class: 'panel challenges' },
      h('h2', {}, opts.title || 'Challenges'),
      h('p', { class: 'hint' }, opts.lede || 'Everyday things that come out of what is on this page. All four answers are real mechanisms and only one is right — commit to it, then go and settle it yourself.'),
      list);
    host.appendChild(sec);
    return sec;
  };
})();
