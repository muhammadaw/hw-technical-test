-- Hitung total pengeluaran salary saat tahun 2021.
SELECT SUM(salary) AS total_salary_2021
FROM employees
WHERE join_date <= '2021-12-31'
  AND (release_date IS NULL OR release_date >= '2021-01-01');
