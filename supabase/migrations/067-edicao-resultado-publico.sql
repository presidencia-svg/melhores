-- Flag pra liberar o resultado de uma edicao na pagina publica /resultados.
-- Default false: nada aparece sem decisao explicita da CDL.
alter table public.edicao
  add column if not exists resultado_publico boolean not null default false;

-- Edicao 2025 de Aracaju (encerrada, resultado ja divulgado na cerimonia).
update public.edicao set resultado_publico = true
 where id = '602eea78-25ea-4f4f-8e0a-e900d4a32990';
