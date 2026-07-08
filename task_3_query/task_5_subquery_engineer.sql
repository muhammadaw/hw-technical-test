-- Subquery untuk employee dengan posisi Engineer yang memiliki experience <= 3 tahun
SELECT *
FROM employees
WHERE id IN (
    SELECT id
    FROM employees
    WHERE position = 'Engineer'
      AND years_of_experience <= 3
);
