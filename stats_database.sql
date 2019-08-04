-- Views table

create table views (
id int auto_increment primary key,
month int,
count bigint,
generated_at timestamp)Engine=InnoDB default charset 'utf8';


-- Comments table

create table comments (
id int auto_increment primary key,
month int,
count bigint,
generated_at timestamp)Engine=InnoDB default charset 'utf8';
