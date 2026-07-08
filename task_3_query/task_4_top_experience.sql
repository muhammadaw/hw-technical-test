-- Menampilkan 3 employee paling banyak yang memiliki Years of Experience
SELECT *
FROM employees
ORDER BY years_of_experience DESC
LIMIT 3;
