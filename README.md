<u>Enter explanation to your part of the code here.</u>

__BasicAnalysis:-__ Uses BERT to rate a comment on a scale of 1 to 5.<br> The 1 to 5 rating is further classified into 1-2.5 for negative, 2.5-3.5 for neutral and 3.5-5 for positive.<br> Each classifcation is further rated on a scale of 1 to 100 where 1 is low and 100 is high.<br> So a negative 100 is very negative and 100 positve is extremly positive.<br>

__PerCommentAnal:-__ Uses en_core_web_sm, a NLP model to split a pdf file into multiple comments and rate them each in the same format used in BasicAnalyis.
