create policy "assigned staff read support tickets"
on public.support_tickets
for select
to authenticated
using (assigned_to = auth.uid());

create policy "assigned staff read ticket messages"
on public.ticket_messages
for select
to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (t.requester_id = auth.uid() or t.assigned_to = auth.uid() or private.is_primary_admin())
  )
);

create policy "ticket participants reply"
on public.ticket_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (t.requester_id = auth.uid() or t.assigned_to = auth.uid() or private.is_primary_admin())
  )
);

create policy "assigned staff update ticket status"
on public.support_tickets
for update
to authenticated
using (assigned_to = auth.uid() or private.is_primary_admin())
with check (assigned_to = auth.uid() or private.is_primary_admin());
