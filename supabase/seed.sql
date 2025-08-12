insert into cached_comparisons (id, prompt, left_model, right_model, left_code, right_code, enabled)
values
('hello-aqua', 'Energetic kinetic type introducing Graphicarena', 'anthropic/claude-3-5-sonnet', 'google/gemini-1.5-pro',
 'export default function Comp(){return (<div style="width:100%;height:100%;background:#000"/>);}',
 'export default function Comp(){return (<div style="width:100%;height:100%;background:#000"/>);}',
 true)
on conflict (id) do nothing;

