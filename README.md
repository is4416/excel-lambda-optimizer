# excel-lambda-optimizer
Optimize pasted Excel LAMBDA formulas automatically.

エクセルで実行可能となるよう、コメント削除等を行いコードを成形します

[example](https://is4416.github.io/excel-lambda-optimizer/)

下記のような単一行のコメントを除去し、成形します  
複数行のコメントには対応していません

```vb
// ---------- ---------- ---------- ---------- ----------
// SP断面から、体積を計算します
// 平均断面法またはプリスモイダル法による体積計算及び戸田式補正を行います
//
// Function SectionVolume (
//   SPRange    : Range    SP
//   ARange     : Range    断面積
//   UniformSpan: Boolean  Prismoidal法で計算 (optional)
//   Alpha      : Number   戸田式補正 (optional)
// ): HSTACK(Number, Number)
// ---------- ---------- ---------- ---------- ----------

SectionVolume = LAMBDA(SPRange, ARange, UniformSpan, Alpha, LET(

  // UniformSpan が設定されている時は設定値
  // 省略されている場合、SPが等配列だった場合は TRUE となる
  // TRUE となった場合、Prismoidal法により体積を計算する

  US, IF(ISOMITTED(UniformSpan),
    LET(
      Span, INDEX(SPRange, 2) - INDEX(SPRange, 1),
      AND(MAP(
        SEQUENCE(ROWS(SPRange) - 2),
        LAMBDA(i, Span = INDEX(SPRange, i + 2) - INDEX(SPRange, i + 1))
      ))
    ),
    UniformSpan
  ),

  // Alpha が設定されている時は設定値
  // 省略されている場合、0 を設定する (補正なし)

  Alp, IF(ISOMITTED(Alpha), 0, Alpha),

  // SPRange のサイズを取得
  // IndexListを作成する
  // Prismoidalの場合、SPは一つ飛びとしてカウントされるため、サイズが小さくなる

  N, ROWS(SPRange),
  IndexList, SEQUENCE(IF(US,
    INT((N - 1) / 2),
    N - 1
  )),

  // 区間長のリスト

  L, IF(US,
    MAP(
      IndexList,
      LAMBDA(i, INDEX(SPRange, (i - 1) * 2 + 3) - INDEX(SPRange, (i - 1) * 2 + 1))
    ),
    MAP(
      IndexList,
      LAMBDA(i, INDEX(SPRange, i + 1) - INDEX(SPRange, i))
    )
  ),

  // SP配列
  // Prismoidalを使用する場合は 1つ飛ばし
  // 最後のSPは 体積が積み上がらないため不要

  SPList, IF(US,
    MAP(
      IndexList,
      LAMBDA(i, INDEX(SPRange, (i - 1) * 2 + 1))
    ),
    DROP(SPRange, - 1)
  ),

  // 積み上げ開始区間の断面積

  A, IF(US,
    MAP(
      IndexList,
      LAMBDA(i, INDEX(ARange, (i - 1) * 2 + 1))
    ),
    DROP(ARange, - 1)
  ),

  // 積み上げ終了区間の断面積

  AA, IF(US,
    MAP(
      IndexList,
      LAMBDA(i, INDEX(ARange, (i - 1) * 2 + 3))
    ),
    DROP(ARange, 1)
  ),

  // Prismoidalに使用する中間点の断面積

  M, IF(US,
    MAP(
      IndexList,
      LAMBDA(i, INDEX(ARange, (i - 1) * 2 + 2))
    ),
    (A + AA) / 2
  ),

  // 区間ごとの体積の合計

  Volumes, (A + 4 * M + AA) / 6 * L + Alp * (AA - A) * L,

  // Prismoidalを使用し、最後のはみ出した区間の処理
  // 平均断面法により体積を計算して追加する

  ExFlag  , US * (MOD(N - 1, 2) = 1),
  ExSPList, INDEX(SPRange, N - 1),
  ExA     , INDEX(ARange, N - 1),
  ExAA    , INDEX(ARange, N),
  ExL     , INDEX(SPRange, N) - INDEX(SPRange, N - 1),
  ExVolume, (ExA + ExAA) / 2 * ExL,

  // 結果を積み上げて返す

  HSTACK(
    IF(ExFlag,
      VSTACK(SPList, ExSPList),
      SPList
    ),
    IF(ExFlag,
      VSTACK(Volumes, ExVolume),
      Volumes
    )
  )
))
```
