alter table public.support_tickets
  add column routing_target text not null default 'nixie'
  check (routing_target in ('nixie','andressa','it','general'));
